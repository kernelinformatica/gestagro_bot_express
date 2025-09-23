const makeWASocket = require('@whiskeysockets/baileys');
const { useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const Boom = require('@hapi/boom');
const qrcode = require('qrcode-terminal');
const pino = require('pino');
const userStates = require('./userStates'); // Manejo de estados de usuario
const { verificarUsuarioValido } = require('../services/apiCliente');
const { esNumeroWhatsApp } = require('./utils'); // Función para verificar número de WhatsApp
const { getCleanId } = require('./utils'); // Función para limpiar el ID
const { extraerNumero } = require('./utils'); // Función para extraer número
const fs = require('fs'); 
// Importar comandos
const info = require('./commands/info');
const menu = require('./commands/menu');
const pesos = require('./commands/ccpesos');
const pesosresumen = require('./commands/ccpesosresumen');
const dolar = require('./commands/ccdolar');
const dolarresumen = require('./commands/ccdolarresumen');
const resucer = require('./commands/resucer');
const disponible = require('./commands/disponible');
const futuro = require('./commands/futuro');
const fichacereal = require('./commands/fichacer');
const ficharomaneos = require('./commands/ficharom');
const cotizaciones = require('./commands/cotizabna');
const reiniciarempresa = require('./commands/reiniciarempresa');
const porDefecto = require('./commands/default');
const mensajes = require('./mensajes/default');
const logger = pino({ level: 'debug' });
const pizarra = require('./commands/pizarra');
const contacto = require('./commands/contacto');
const config = require('./config').config ;
let sockInstance = null;
let qrActual = null;

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth');
  const sock = makeWASocket.default({ auth: state });

  sockInstance = sock;

  // Guardar credenciales
  sock.ev.on('creds.update', saveCreds);

  // Manejo de conexión
  sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {


    if (qr) {
      qrActual = qr;
      console.log('🔐 Escaneá este QR para vincular:');
      const qrcode = require('qrcode-terminal');
      qrcode.generate(qr, { small: true });
    }


    if (connection === 'close') {
      let reasonCode = DisconnectReason.connectionClosed;

      if (lastDisconnect?.error?.output?.statusCode !== undefined) {
        reasonCode = lastDisconnect.error.output.statusCode;
      } else if (lastDisconnect?.error?.message?.includes('logged out')) {
        reasonCode = DisconnectReason.loggedOut;
      }

      const shouldReconnect = reasonCode !== DisconnectReason.loggedOut;

      console.log(`Conexión cerrada. Código: ${reasonCode}. ¿Reconectar? → ${shouldReconnect}`);

      if (shouldReconnect) {
        setTimeout(() => startBot(), 3000);
      }

    }

    if (connection === 'open') {
      console.log('✅ ¡Conectado con WhatsApp!');
    }
    const logoBuffer = fs.readFileSync(config.clienteLogo);
  });

  // Evitar procesar mensajes duplicados
  const processedMessages = new Set();
  setInterval(() => processedMessages.clear(), 60000); // Limpiar cada minuto

  // Manejo de mensajes
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    console.log('📍 Punto de control 1 - Nuevo mensaje recibido');
    try {
      const msg = messages[0];

      // Ignorar mensajes del sistema o enviados por el propio bot
      if (!msg.message || msg.key.fromMe || msg.key.remoteJid === 'status@broadcast') {
        console.log('⚠️ ' + msg.key.remoteJid + ', Mensaje del sistema o propio, ignorando.');
        return;
      }



      const messageID = msg.key.id;
      if (processedMessages.has(messageID)) return; // Ya procesado
      processedMessages.add(messageID);
      //console.log('📦 Tipo de mensaje:', Object.keys(msg.message));
      const from = msg.key.remoteJid ?? '';


      //console.log('📥 Mensaje recibido :', msg);
      const text = normalizeText(msg);

      console.log('🧾 Texto normalizado:', text);


      if (!text) {
        //console.log('⚠️ No se recibió texto válido.');
        return;
      }



       console.log(`📩 Mensaje recibido de ${from}: ${text}: ${type}`);
      /// leo datos del usuario
      const jid = from;
      const numero = extraerNumero(jid);
      console.log('📨 Numero extraido: ', numero)
      const validacion = await verificarUsuarioValido(numero);
      console.log('📨 Validacion de usuario: ', validacion)
      if (validacion['usuario'] === null || validacion['usuario'] === undefined) {
        console.log('❌ Usuario no autorizado:', numero);
        await sock.sendMessage(from, { text: "😢 "+mensajes.noAutorizado });
        return

      }
      const usuario = validacion['usuario'];
      const [id, cta, clave, nombre] = usuario;
      const coope = parseInt(id, 10); 
      
      if (config.apiPropietaria === true){
       
        if (config.cliente != coope){
          console.log ("😢 Cliente no autorizado")
          await sock.sendMessage(from, {  text: "😢 "+mensajes.noAutorizado });
          return
        }
       
      }
      if (!id) {
        console.log('❌ Usuario no autorizado:', numero);
        await sock.sendMessage(from, { text: "😢 "+mensajes.noAutorizado });
        return
      }
      const cuenta = cta;
      const nombreSocio = nombre
      //console.log('📦 -------------------------> Usuario:', numero + "| Cliente: " + coope + " | Nombre Socio: " + nombreSocio + " <-----------------------------------");
     
      const comandosPorCliente = {
        '01': {
          menu,
          'menu': menu,
          '0': menu,
          'hola': menu,
          info,
          'info': info,
          '1': info,
          pesos,
          'pesos': pesos,
          '2': pesos,
          pesosresumen,
          'resumen': pesosresumen,
          '10': pesosresumen,
          dolar,
          'dolar': dolar,
          '3': dolar,
          'resumendolar': dolarresumen,
          '11': dolarresumen,
          cereales: resucer,
          '4': resucer,
          f: fichacereal,
          '55': fichacereal,
          r: ficharomaneos,
          '56': ficharomaneos,
          disponible,
          '5': disponible,
          futuro,
          '6': futuro,
          cotizaciones,
          '7': cotizaciones,
          reiniciarempresa,
          '99': reiniciarempresa
        },
        '03': {

          menu,
          'menu': menu,
          '0': menu,
          'hola': menu,
          info,
          'info': info,
          '1': info,
          pesos,
          'pesos': pesos,
          '2': pesos,
          pesosresumen,
          'resumen': pesosresumen,
          '10': pesosresumen,
          dolar,
          'dolar': dolar,
          '3': dolar,
          'resumendolar': dolarresumen,
          '11': dolarresumen,
          cotizaciones,
          '4': cotizaciones,
          cotizaciones,
          '5': cotizaciones,

          reiniciarempresa,
          '99': reiniciarempresa
        },
        '05': {
          menu,
          'menu': menu,
          '0': menu,
          'hola': menu,
          info,
          'info': info,
          '1': info,
          pesos,
          'pesos': pesos,
          '2': pesos,
          pesosresumen,
          'resumen': pesosresumen,
          '10': pesosresumen,
          cereales: resucer,
          '3': resucer,
          f: fichacereal,
          '55': fichacereal,
          r: ficharomaneos,
          '56': ficharomaneos,
          pizarra,
          '4': pizarra,
          reiniciarempresa,
          '99': reiniciarempresa
        },
        '06': {
          menu,
          'menu': menu,
          '0': menu,
          'hola': menu,
          info,
          'info': info,
          '1': info,
          pesos,
          'pesos': pesos,
          '2': pesos,
          pesosresumen,
          'resumen': pesosresumen,
          '10': pesosresumen,
          cereales: resucer,
          '3': resucer,
          f: fichacereal,
          '55': fichacereal,
          r: ficharomaneos,
          '56': ficharomaneos,
          cotizaciones,
          '4': cotizaciones,
          reiniciarempresa,
          '99': reiniciarempresa
        },
        '11': {
          menu,
          'menu': menu,
          '0': menu,
          'hola': menu,
          pesos,
          'pesos': pesos,
          '1': pesos,
          pesosresumen,
          'resumen': pesosresumen,
          '10': pesosresumen,
          dolar,
          'dolar': dolar,
          '2': dolar,
          'resumendolar': dolarresumen,
          '11': dolarresumen,
          cereales: resucer,
          '3': resucer,
          f: fichacereal,
          '55': fichacereal,
          r: ficharomaneos,
          '56': ficharomaneos,
          disponible,
          '4': disponible,
          futuro,
          '5': futuro,
          cotizaciones,
          '6': cotizaciones,
          contacto,
          '7': contacto,
          reiniciarempresa,
          '99': reiniciarempresa
        },
        '12': {
          menu,
          'menu': menu,
          '0': menu,
          'hola': menu,
          pesos,
          'pesos': pesos,
          '1': pesos,
          pesosresumen,
          'resumen': pesosresumen,
          '10': pesosresumen,
          dolar,
          'dolar': dolar,
          '2': dolar,
          'resumendolar': dolarresumen,
          '11': dolarresumen,
          cereales: resucer,
          '3': resucer,
          f: fichacereal,
          '55': fichacereal,
          r: ficharomaneos,
          '56': ficharomaneos,
          disponible,
          '4': disponible,
          futuro,
          '5': futuro,
          cotizaciones,
          '6': cotizaciones,
          contacto,
          '7': contacto,
          reiniciarempresa,
          '99': reiniciarempresa
        },
        '29': {
          menu,
          'menu': menu,
          '0': menu,
          'hola': menu,
          info,
          'info': info,
          '1': info,
          pesos,
          'pesos': pesos,
          '2': pesos,
          pesosresumen,
          'resumen': pesosresumen,
          '10': pesosresumen,
          dolar,
          'dolar': dolar,
          '3': dolar,
          'resumendolar': dolarresumen,
          '11': dolarresumen,
          cereales: resucer,
          '4': resucer,
          f: fichacereal,
          '55': fichacereal,
          r: ficharomaneos,
          '56': ficharomaneos,
          cotizaciones,
          '5': cotizaciones,
          reiniciarempresa,
          '99': reiniciarempresa
        },
        'default': {
          menu,
          '0': menu,
          info,
          '1': info,
          pesos,
          'pesos': pesos,
          '2': pesos,
          pesosresumen,
          'resumen': pesosresumen,
          '10': pesosresumen,
          dolar,
          'dolar': dolar,
          '3': dolar,
          'resumendolar': dolarresumen,
          '11': dolarresumen,
          cereales: resucer,
          '4': resucer,
          f: fichacereal,
          '55': fichacereal,
          r: ficharomaneos,
          '56': ficharomaneos,
          disponible,
          '5': disponible,
          futuro,
          '6': futuro,
          cotizaciones,
          '7': cotizaciones,
          reiniciarempresa,
          '99': reiniciarempresa
        }
      };


      let cli = ""
      if (coope < 9){
        cli = "0"+coope;
      }
      const comandos = comandosPorCliente[cli] || comandosPorCliente['default'];
      console.log('📍 Punto de control 2');
      console.log('🔍 Comandos disponibles para este usuario:', comandos);
      // Obtener estado del usuario
      const userState = userStates.getState(from) || {};
      console.log('🔍 Estado del usuario:', userState);

      // Manejo de selección de empresa
      if (userState.estado === 'seleccion_empresa') {
        await handleEmpresaSeleccion(sock, from, text, userState, comandos);
        return;
      }

      // Manejo de comandos en estado "resumen_cereales"
      if (userState.estado === 'resumen_cereales') {
        await handleResumenCereales(sock, from, text, userState);
        return;
      }


      // Detectar y ejecutar comando
      const comandoDetectado = detectarComando(text, Object.keys(comandos));
      console.log('📍 Punto de control 4 ->' + String(comandoDetectado));
      if (comandoDetectado) {
        await comandos[comandoDetectado](sock, from, text, msg);
      } else {
        await sock.sendMessage(getCleanId(from), { text: mensajes.comando_desconocido });
        //await porDefecto(sock, from, text, msg);
      }
    } catch (error) {
      console.error('🛑 Error procesando mensaje:', error);
      await sock.sendMessage(getCleanId(from), { text: '❌ Ocurrió un error al procesar su solicitud. Intente nuevamente más tarde.' });
    }
  });
}




// Normalizar texto recibido
function normalizeText(msg) {
  //console.log('📨 Mensaje completo recibido:');
  console.dir(msg, { depth: null });

  const m = msg.message;

  // Ignorar mensajes de protocolo (eliminados, modo desaparición, etc.)
  if (m?.protocolMessage) return '';

  // Ignorar reacciones (pueden procesarse aparte si querés)
  if (m?.reactionMessage) return '';

  // Ignorar mensajes de stickers (sin texto)
  if (m?.stickerMessage) return '';

  // Ignorar audios sin transcripción
  if (m?.audioMessage && !m.audioMessage.caption) return '';

  // Extraer texto de múltiples tipos de mensajes
  const text =
    m?.conversation ??
    m?.extendedTextMessage?.text ??
    m?.imageMessage?.caption ??
    m?.videoMessage?.caption ??
    m?.documentMessage?.caption ??
    m?.buttonsResponseMessage?.selectedButtonId ??
    m?.listResponseMessage?.title ??
    m?.audioMessage?.caption ?? // si el audio tiene texto
    m?.contactMessage?.displayName ?? // si se envía un contacto con nombre
    m?.locationMessage?.name ?? // si se envía una ubicación con nombre
    '';

  return text.trim().toLowerCase();
}




// Detectar comando
function detectarComando(texto, comandosValidos) {
  const palabras = texto.split(/\s+/);
  return palabras.find((p) => comandosValidos.includes(p)) ?? null;
}

// Manejo de selección de empresa
async function handleEmpresaSeleccion(sock, from, text, userState, comandos) {
  const seleccion = parseInt(text, 10);

  if (isNaN(seleccion) || seleccion < 1 || seleccion > userState.empresas.length) {
    await sock.sendMessage(getCleanId(from), { text: mensajes.mensaje_error_comando });
    return;
  }

  const empresaSeleccionada = userState.empresas[seleccion - 1];
  userStates.setState(from, {
    ...userState,
    estado: null,
    empresaSeleccionada,
    cuentaSeleccionada: empresaSeleccionada.cuenta,
  });

  console.log('🔍 Empresa seleccionada:', empresaSeleccionada);
  await sock.sendMessage(getCleanId(from), { text: `✅ Ha seleccionado la empresa: ${empresaSeleccionada.nombre}` });

  // Retomar comando pendiente
  const comandoPendiente = userState.comandoPendiente;
  if (comandoPendiente) {
    console.log('🔄 Retomando el comando pendiente:', comandoPendiente);
    const { comando, argumentos } = comandoPendiente;
    if (comandos[comando]) {
      await comandos[comando](sock, from, argumentos);
    } else {
      await sock.sendMessage(getCleanId(from), { text: '⚠️ No se pudo retomar el comando pendiente.' });
    }
  }
}

// Manejo de estado "resumen_cereales"
async function handleResumenCereales(sock, from, text, userState) {
  const tipo = text[0]?.toLowerCase(); // Primer carácter del texto
  const numero = text.slice(1); // Resto del texto

  // Si el usuario escribe "menu" o cualquier texto no válido, salir del estado y mostrar el menú principal
  if (text === 'menu' || !['f', 'r'].includes(tipo) || !userState.opcionesFicha[`F${numero}`] && !userState.opcionesRomaneos[`R${numero}`]) {
    userStates.setState(from, { estado: null }); // Limpiar el estado del usuario
    
    const mensajeMenu = mensajes.mensaje_volver;

    await sock.sendMessage(getCleanId(from), { text: mensajeMenu });
    return;
  }

  // Manejo de fichas de cereales (F) o romaneos (R)
  if (tipo === 'f' && userState.opcionesFicha[`F${numero}`]) {
    const { cereal, clase, cosecha } = userState.opcionesFicha[`F${numero}`];
    const comandoCompleto = `F ${cereal} ${clase} ${cosecha}`;
    console.log('🔍 Comando completo ficha cereales:', comandoCompleto);
    await fichacereal(sock, from, comandoCompleto, userState);
  } else if (tipo === 'r' && userState.opcionesRomaneos[`R${numero}`]) {
    const { cereal, clase, cosecha } = userState.opcionesRomaneos[`R${numero}`];
    const comandoCompleto = `R ${cereal} ${clase} ${cosecha}`;
    console.log('🔍 Comando completo ficha romaneos:', comandoCompleto);
    await ficharomaneos(sock, from, comandoCompleto, userState);
  } else {
    // Si el texto no es válido, enviar un mensaje de error
    await sock.sendMessage(getCleanId(from), { text: mensajes.comando_desconocido });
  }
}
module.exports = { startBot, sockInstance };