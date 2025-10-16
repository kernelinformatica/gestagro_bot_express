// 📦 Importaciones ESM
import { makeWASocket, useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import Boom from '@hapi/boom';
import qrcode from 'qrcode-terminal';
import pino from 'pino';
import fs from 'fs';

// 🧠 Módulos locales
import userStates from './userStates.js';
import { verificarUsuarioValido, loginRegistrarUsuario, login, loginValidarCuenta, loginEsperarRespuestaUsuario } from '../services/apiCliente.js';
import { esNumeroWhatsApp, getCleanId, extraerNumero } from './utils.js';

// 📥 Comandos
import info from './commands/info.js';
import menu from './commands/menu.js';
import pesos from './commands/ccpesos.js';
import pesosresumen from './commands/ccpesosresumen.js';
import dolar from './commands/ccdolar.js';
import solicitarDinero from './commands/solicitarDinero.js';
import dolarresumen from './commands/ccdolarresumen.js';
import resucer from './commands/resucer.js';
import disponible from './commands/disponible.js';
import futuro from './commands/futuro.js';
import fichacereal from './commands/fichacer.js';
import ficharomaneos from './commands/ficharom.js';
import cotizaciones from './commands/cotizabna.js';
import reiniciarempresa from './commands/reiniciarempresa.js';
import porDefecto from './commands/default.js';
import mensajes from './mensajes/default.js';
import pizarra from './commands/pizarra.js';
import contacto from './commands/contacto.js';
import subirmercado from './commands/uploadFtp.js';
import salir from './commands/salir.js';
import { config } from './config.js';

// 🧾 Logger
const logger = pino({ level: 'debug' });







let sockInstance = null;
let qrActual = null;

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth');
  const sock = makeWASocket.default({ auth: state  });

  sockInstance = sock;

  // Guardar credenciales
  sock.ev.on('creds.update', saveCreds);

  
  sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
    console.log('🔄 Estado de conexión:', connection, lastDisconnect, qr);
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

      
      // console.log(`📩 Mensaje recibido de ${from}: ${text}: ${type}`);
     
      const jid = from;
      const numero = extraerNumero(jid, msg.key.senderPn);
      const numeroInterno = jid.includes('@lid') ? jid.split('@')[0] : '0';
      
      console.log('📨 Numero extraido: ', numero)
      console.log('📨 Identificador interno:', numeroInterno);
      if (config.apiPropietaria === true) {
        cliente = config.cliente
      } else {
        cliente = "0"
      }
      const validacion = await verificarUsuarioValido(numero, cliente);
      console.log('Cliente actual: ', cliente); 
      console.log("------------------------------------------------------------------------------------------------------");
      console.log('🔍 Validación de usuario:', validacion);
      console.log("------------------------------------------------------------------------------------------------------");
     
      // Registro de USUARIOS
      if (!validacion["usuario"] || typeof validacion["usuario"] !== "object") {  
     
        const userState = userStates.getState(from) || {};
    
        // Si el estado del usuario ya está en "esperando cuenta", no enviar el mensaje inicial
        if (!userState.estado) {
            console.log('❌ Usuario no autorizado:', numero);
            await sock.sendMessage(from, { text: "❌ 😢 No estás registrado como asociado.\n\nPor favor, ingresa tu número de cuenta asociada proporcionado por la Cooperativa para poder validar tu usuario." });
    
            // Actualizar el estado del usuario a "esperando cuenta"
            userStates.setState(from, { estado: 'esperando_cuenta' });
            return;
        }
    
        // Si el estado es "esperando cuenta", procesar la respuesta del usuario
        if (userState.estado === 'esperando_cuenta') {
            console.log('⏳ Esperando número de cuenta del usuario...');
            const cuentaResponse = text.trim(); // Usar el texto ingresado como número de cuenta
            console.log('📨 Número de cuenta recibido:', cuentaResponse);
    
            // Validar el número de cuenta
            const cuentaValida = await loginValidarCuenta(cuentaResponse);
            await sock.sendMessage(from, { text: "⏳ Validando datos, aguarde..." });
    
            if (!cuentaValida) {
                await sock.sendMessage(from, { text: "❌ 😢 Número de cuenta inválida. Intenta nuevamente." });
    
                // Reiniciar el estado del usuario
                userStates.setState(from, null);
                await sock.sendMessage(from, { text: "🔄 Vamos a empezar de nuevo. Por favor, ingresa tu número de cuenta asociada." });
                return;
            }
    
            // Solicitar la clave del usuario
            await sock.sendMessage(from, { text: "🔒 Por favor, ingresa tu clave para la cuenta " + cuentaResponse });
            console.log('⏳ Esperando clave del usuario...');
    
            // Actualizar el estado del usuario a "esperando clave"
            userStates.setState(from, { estado: 'esperando_clave', cuenta: cuentaResponse });
            return;
        }
    
        // Si el estado es "esperando clave", procesar la clave del usuario
        if (userState.estado === 'esperando_clave') {
          await sock.sendMessage(from, { text: "⏳ Validando datos, aguarde..." });
            console.log('⏳ Esperando clave del usuario...');
            const claveResponse = text.trim(); // Usar el texto ingresado como clave
            console.log('📨 Clave recibida:', claveResponse);
    
            // Validar la clave del usuario
            const cuentaResponse = userState.cuenta; // Recuperar la cuenta almacenada en el estado
            const claveValida = await login(cuentaResponse, claveResponse);
            console.log('🔑 Login:', claveValida, cliente);
            if (!claveValida) {
                await sock.sendMessage(from, { text: "❌ 🔑 Clave inválida. Intenta nuevamente.\n\nSi no recuerda su clave, póngase en contacto con la Cooperativa" });
    
                // Reiniciar el estado del usuario
                userStates.setState(from, null);
                await sock.sendMessage(from, { text: "🔄 Vamos a empezar de nuevo. Por favor, ingresa tu número de cuenta asociada." });
                return;
            }
    
            // Registrar el número de teléfono
            const registroValido = await loginRegistrarUsuario(numero, numeroInterno, cuentaResponse, cliente);
            console.log('📝 Registro de usuario:', registroValido);
            if (!registroValido) {
                await sock.sendMessage(from, { text: "❌ 🤖 Error al registrar el usuario. Intenta nuevamente por favor." });
    
                // Reiniciar el estado del usuario
                userStates.setState(from, null);
                await sock.sendMessage(from, { text: "🔄 Vamos a empezar de nuevo. Por favor, ingresa tu número de cuenta asociada." });
                return;
            }
    
            console.log('✅ Usuario registrado exitosamente:', numero);
            await sock.sendMessage(from, { text: mensajes.felicitaciones_registro });
    
            // Limpiar el estado del usuario
            userStates.setState(from, null);
            return;
        }
      }
      // Fin de registro de USUARIOS
     
      const usuario = validacion["usuario"];
      const id = usuario["coope"]; 
      const cta = usuario["cuenta"];
      const clave = usuario["clave"];
      const nombre = usuario["nombre"];
      
      console.log(`ID: ${id}, Cuenta: ${cta}, Clave: ${clave}, Nombre: ${nombre}`);

        // Si necesitas usar coope como número, conviértelo aquí
      const coope = parseInt(id, 10);
        
      console.log("============================= ACA VALIDO EL USUARIO: "+ cta+ " =========================================")

      if (!text) {
        //console.log('⚠️ No se recibió texto válido.');
        return;
      }
      if (config.apiPropietaria === true) {

        if (config.cliente != coope) {
          console.log("😢 Cliente no autorizado")
          await sock.sendMessage(from, { text: "😢 " + mensajes.noAutorizado });
          return
        }
        // Detectar si el mensaje contiene una imagen solo para maximo paz
        if (msg.message.imageMessage || coope === "05") {
          await subirmercado(sock, from, text, msg, cta); // Llama al comando de subida SFTP
          return;
        }

      }
      if (!id) {
        console.log('❌ Usuario no autorizado:', numero);
        await sock.sendMessage(from, { text: "😢 " + mensajes.noAutorizado });
        return
      }
      const cuenta = cta;
      const nombreSocio = nombre
      console.log('📦 -------------------------> Usuario:', numero + "| Cliente: " + coope + " | Nombre Socio: " + nombreSocio + " <-----------------------------------");

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
          salir,
          '8': salir,
          'salir': salir,

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
          cotizaciones,
          '5': cotizaciones,
          contacto,
          '6': contacto,
          solicitarDinero,
          '7': solicitarDinero,
          salir,
          '8': salir,
          'salir': salir,
          subirmercado,
          '98': subirmercado,
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
          'dolarresumen': dolarresumen,
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
          salir,
          '8': salir,
          'salir': salir,
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
          contacto,
          '6': contacto,
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
      if (coope < 9) {
        cli = "0" + coope;
      } else {
        cli = coope;
      }
      console.log('📍 Punto de control 1.5');
      const comandos = comandosPorCliente[cli] || comandosPorCliente['default'];
      console.log("comandos: " + comandosPorCliente[cli])
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

      // Manejo de comandos en estado "pedido_fondos"
      if (userState.estado === 'pedido_fondos') {
        //await handleResumenCereales(sock, from, text, userState);
        //return;
      }
      // Manejo de comandos en estado "pedido_fondos"
      if (userState.estado === 'reserva_cereales') {
        //await handleResumenCereales(sock, from, text, userState);
        //return;
      }



      // Detectar y ejecutar comando
      const comandoDetectado = detectarComando(text, Object.keys(comandos));
     
      if (comandoDetectado) {
        console.log('✅ Comando detectado:', "LLEGA ACA ?");
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
    const { cereal, clase, cosecha, cereal_codigo } = userState.opcionesFicha[`F${numero}`];
    const comandoCompleto = `F ${cereal} ${clase} ${cosecha} ${cereal_codigo}`;
    console.log('🔍 Comando completo ficha cereales:', comandoCompleto);
    await fichacereal(sock, from, comandoCompleto, userState);
  } else if (tipo === 'r' && userState.opcionesRomaneos[`R${numero}`]) {
    const { cereal, clase, cosecha, cereal_codigo } = userState.opcionesRomaneos[`R${numero}`];
    const comandoCompleto = `R ${cereal} ${clase} ${cosecha} ${cereal_codigo}`;
    console.log('🔍 Comando completo ficha romaneos:', comandoCompleto);
    await ficharomaneos(sock, from, comandoCompleto, userState);
  } else {
    // Si el texto no es válido, enviar un mensaje de error
    await sock.sendMessage(getCleanId(from), { text: mensajes.comando_desconocido });
  }
}
module.exports = { startBot, sockInstance };