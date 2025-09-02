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
// Importar comandos
const info = require('./commands/info');
const ayuda = require('./commands/ayuda');
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
const test = require('./commands/test');
const reiniciarempresa = require('./commands/reiniciarempresa');
const porDefecto = require('./commands/default');
const mensajes = require('./mensajes');
const logger = pino({ level: 'debug' });

let sockInstance = null;

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth');
  const sock = makeWASocket.default({ auth: state });
  sockInstance = sock;

  // Guardar credenciales
  sock.ev.on('creds.update', saveCreds);

  // Manejo de conexión
  sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      console.log('🔐 Escaneá este QR para vincular:');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      const shouldReconnect =
        lastDisconnect?.error?.isBoom &&
        lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut;
      console.log('Conexión cerrada. ¿Reconectar? →', shouldReconnect);
      if (shouldReconnect) {
        setTimeout(() => startBot(), 3000);
      }
    }

    if (connection === 'open') {
      console.log('✅ ¡Conectado con WhatsApp!');
    }
  });

  // Evitar procesar mensajes duplicados
  const processedMessages = new Set();
  setInterval(() => processedMessages.clear(), 60000); // Limpiar cada minuto

  // Manejo de mensajes
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    try {
      const msg = messages[0];

      // Ignorar mensajes del sistema o enviados por el propio bot
      console.log('-----> :', msg.key.remoteJid);
      if (!msg.message || msg.key.fromMe || msg.key.remoteJid === 'status@broadcast') {
        return;
      }

      const messageID = msg.key.id;
      if (processedMessages.has(messageID)) return; // Ya procesado
      processedMessages.add(messageID);

      const from = msg.key.remoteJid ?? '';
      const text = normalizeText(msg);

      if (text == "") {
        console.log('⚠️ No se recibió texto válido.');
        return;
      }
    
     

      console.log(`📩 Mensaje recibido de ${from}: ${text}: ${type}`);
      /// leo datos del usuario
      const jid = from;

 //     const numero = extraerNumero(jid);
      const numeroFull = jid.split('@')[0];
      const numero = numeroFull.slice(3); 
      console.log('📦 -------------------------> Numero del usuario:',numero +" <-----------------------------------");
      const validacion = await verificarUsuarioValido(numero);
      const usuario = validacion['usuario'];
      const [id, cta, nombre] = usuario;
      const coope = id;
      const cuenta = cta;
      const nombreSocio = usuario[3].split(' ').slice(1).join(' ');

      
      //console.log('📦 -------------------------> Numero del usuario:',numero +" <-----------------------------------");

      // Definir comandos
      
      const comandos = {
        ayuda,
        menu: ayuda,
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
        test,
        '00': test,
        reiniciarempresa,
        '99': reiniciarempresa,
      };

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
      if (comandoDetectado) {
        await comandos[comandoDetectado](sock, from, text, msg);
      } else {
        await porDefecto(sock, from, text, msg);
      }
    } catch (error) {
      console.error('🛑 Error procesando mensaje:', error);
      await sock.sendMessage(from, { text: '❌ Ocurrió un error al procesar su solicitud. Intente nuevamente más tarde.' });
    }
  });
}




// Normalizar texto recibido
function normalizeText(msg) {
  return (
    msg.message?.conversation ??
    msg.message?.extendedTextMessage?.text ??
    msg.message?.imageMessage?.caption ??
    msg.message?.videoMessage?.caption ??
    msg.message?.documentMessage?.caption ??
    msg.message?.buttonsResponseMessage?.selectedButtonId ??
    msg.message?.listResponseMessage?.title ??
    ''
  ).trim().toLowerCase();
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
    await sock.sendMessage(from, { text: mensajes.mensaje_error_comando });
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
  await sock.sendMessage(from, { text: `✅ Ha seleccionado la empresa: ${empresaSeleccionada.nombre}` });

  // Retomar comando pendiente
  const comandoPendiente = userState.comandoPendiente;
  if (comandoPendiente) {
    console.log('🔄 Retomando el comando pendiente:', comandoPendiente);
    const { comando, argumentos } = comandoPendiente;
    if (comandos[comando]) {
      await comandos[comando](sock, from, argumentos);
    } else {
      await sock.sendMessage(from, { text: '⚠️ No se pudo retomar el comando pendiente.' });
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
    const mensajeMenu =mensajes.menu+mensaje_volver;
    await sock.sendMessage(from, { text: mensajeMenu });
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
    await sock.sendMessage(from, { text:mensajes.comando_desconocido });
  }
}
module.exports = { startBot, sockInstance };