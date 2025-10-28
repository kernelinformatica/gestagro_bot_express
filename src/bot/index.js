// 📦 Importaciones ESM
import { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import { clientesCodigo } from './config.js';
import Boom from '@hapi/boom';
import qrcode from 'qrcode-terminal';
import pino from 'pino';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
// 🧠 Módulos locales
import userStates from './userStates.js';
import { verificarUsuarioValido, loginRegistrarUsuario, login, loginValidarCuenta, loginEsperarRespuestaUsuario, confirmarPedidoDeFondos, traerSucursales, traerCbusPorCuenta, traerTransacciones } from '../services/apiCliente.js';
import { esNumeroWhatsApp, getCleanId, extraerNumero } from './utils.js';
import { manejarRegistroUsuario } from './registroUsuario.js';




// 📥 Comandos
import info from './commands/info.js';
import menu from './commands/menu.js';
import pesos from './commands/ccpesos.js';
import dolar from './commands/ccdolar.js';
import pesosresumen from './commands/ccpesosresumen.js';
import dolarresumen from './commands/ccdolarresumen.js';
import resucer from './commands/resucer.js';
import fichacereal from './commands/fichacer.js';
import ficharomaneos from './commands/ficharom.js';
import disponible from './commands/disponible.js';
import futuro from './commands/futuro.js';
import cotizaciones from './commands/cotizabna.js';
import contacto from './commands/contacto.js';
import salir from './commands/salir.js';
import mensajes from './mensajes/default.js';
import solicitarDinero from './commands/solicitarDinero.js';
import pizarra from './commands/pizarra.js';
import subirmercado from './commands/uploadFtp.js';
/*import porDefecto from './commands/default.js';




*/
import { config } from './config.js';

// 🧾 Logger
const logger = pino({ level: 'debug' });







let sockInstance = null;
let qrActual = null;

export async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth');
  const { version } = await fetchLatestBaileysVersion(); // Obtener la última versión de WhatsApp compatible
  const sock = makeWASocket({
    auth: state,
    logger,
    version,
    printQRInTerminal: true, // Imprime el QR directamente en la terminal
  });

  sockInstance = sock;

  // Guardar credenciales
  sock.ev.on('creds.update', saveCreds);


  // Manejo de eventos de conexión
  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      qrActual = qr;
      console.log('🔐 Escaneá este QR para vincular:');
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
    try {
      const msg = messages[0];
      // Ignorar mensajes del sistema o enviados por el propio bot
      if (!msg.message || msg.key.fromMe || msg.key.remoteJid === 'status@broadcast') {
        console.log('⚠️ ' + msg.key.remoteJid + ', Mensaje del sistema o propio, ignorando.');
        return;
      }



      const uniqueMessageID = `${msg.key.remoteJid}-${msg.key.id}`;
      if (processedMessages.has(uniqueMessageID)) {
        console.log('⚠️ Mensaje duplicado detectado, ignorando:', uniqueMessageID);
        return; // Ya procesado
      }
      processedMessages.add(uniqueMessageID);
      //console.log('📦 Tipo de mensaje:', Object.keys(msg.message));
      const from = msg.key.remoteJid ?? '';


      //console.log('📥 Mensaje recibido :', msg);

      const text = normalizeText(msg);


      // console.log(`📩 Mensaje recibido de ${from}: ${text}: ${type}`);

      const jid = from;
      const numero = extraerNumero(jid, msg.key.senderPn);
      let numeroInterno = jid.includes('@lid') ? jid.split('@')[0] : '0';
      if (!numeroInterno || numeroInterno === '0') {
        numeroInterno = 0;
      }
      let cliente = 0;
      
      console.log('📨 Numero extraido: ', numero)
      console.log('📨 Identificador interno:', numeroInterno);
      console.log('📨 JID completo:', jid);
      console.log('📨 Api Propietaria: ', config.apiPropietaria, config.cliente);
      console.log('📨 Tipo y valor de config.apiPropietaria:', typeof config.apiPropietaria, config.apiPropietaria);
      try {
        if (config.apiPropietaria === true || config.apiPropietaria === "true") {
         
          cliente = config.cliente;
          
        } else {
          cliente = "0";
        }

      } catch (error) {
        console.error('🛑 Error en la configuración de cliente:', error);
      }

      const validacion = await verificarUsuarioValido(numero, cliente);
      //console.log('Cliente actual: ', cliente);
      //console.log("------------------------------------------------------------------------------------------------------");
      //console.log('🔍 Validación de usuario:', validacion);
      //console.log("------------------------------------------------------------------------------------------------------");

      // Registro de USUARIOS
      
      if (!validacion["usuario"] || typeof validacion["usuario"] !== "object") {
        console.log('📍 Punto de control 1.5 - Antes de manejarRegistroUsuario -> '+cliente);
        const mensajesCliente = await cargarMensajesCliente(parseInt(cliente, 10));
        await sock.sendMessage(from, { text: `⏳ ${mensajesCliente.mensaje_aguarde}` });
        const userState = userStates.getState(from) || {};
      
        // Si el usuario no tiene estado, enviar el mensaje inicial y detener el flujo
        if (!userState.estado) {
          console.log('❌ Usuario no autorizado:', numero);
          await sock.sendMessage(from, {
            text: mensajesCliente.registro_no_registrado,
          });
      
          // Inicializar el estado del usuario con bloqueado: false
          userStates.setState(from, { estado: 'esperando_cuenta', bloqueado: false });
          return; // Detener el flujo aquí
        }
      
        // Manejo del estado "esperando_cuenta"
        if (userState.estado === 'esperando_cuenta') {
          if (userState.bloqueado) {
            console.log('⏳ Usuario ya está en proceso de validación, esperando respuesta...');
            return;
          }
      
          console.log('⏳ Esperando número de cuenta del usuario...');
          const cuentaResponse = text.trim(); // Usar el texto ingresado como número de cuenta
          console.log('📨 Número de cuenta recibido:', cuentaResponse);
      
          // Validar si el usuario ingresó un número de cuenta
          if (!cuentaResponse || isNaN(cuentaResponse)) {
            await sock.sendMessage(from, { text: mensajesCliente.registro_cuenta_invalida  });
            return;
          }
      
          // Bloquear el estado para evitar múltiples mensajes
          userStates.setState(from, { ...userState, bloqueado: true });
      
          try {
            // Validar el número de cuenta
            await sock.sendMessage(from, { text: mensajesCliente.mensaje_aguarde });
            const cuentaValida = await loginValidarCuenta(cuentaResponse);
      
            if (!cuentaValida) {
              await sock.sendMessage(from, { text: mensajesCliente.registro_cuenta_invalida  });
      
              // Reiniciar el estado del usuario
              userStates.setState(from, { estado: 'esperando_cuenta', bloqueado: false });
              return;
            }
      
            // Solicitar la clave del usuario
            await sock.sendMessage(from, { text: mensajesCliente.registro_solicita_clave+" Nro de cuenta: "+cuentaResponse  });
            console.log('⏳ Esperando clave del usuario...');
      
            // Actualizar el estado del usuario a "esperando_clave"
            userStates.setState(from, { estado: 'esperando_clave', cuenta: cuentaResponse, bloqueado: false });
          } catch (error) {
            console.error('🛑 Error al validar la cuenta:', error);
            await sock.sendMessage(from, { text: mensajesCliente.registro_error_general + " "+error });
      
            // Reiniciar el estado del usuario
            userStates.setState(from, { estado: 'esperando_cuenta', bloqueado: false });
          }
          return;
        }
      
        // Manejo del estado "esperando_clave"
        if (userState.estado === 'esperando_clave') {
          if (userState.bloqueado) {
            console.log('⏳ Usuario ya está en proceso de validación, esperando respuesta...');
            return;
          }
      
          console.log('⏳ Esperando clave del usuario...');
          const claveResponse = text.trim(); // Usar el texto ingresado como clave
          console.log('📨 Clave recibida:', claveResponse);
      
          // Bloquear el estado para evitar múltiples mensajes
          userStates.setState(from, { ...userState, bloqueado: true });
      
          try {
            // Validar la clave del usuario
            const cuentaResponse = userState.cuenta; // Recuperar la cuenta almacenada en el estado
            const claveValida = await login(cuentaResponse, claveResponse);
            console.log('🔑 Login:', claveValida, cliente);
      
            if (!claveValida) {
              await sock.sendMessage(from, {
                text: mensajesCliente.registro_clave_invalida,
              });
      
              // Reiniciar el estado del usuario completamente
              userStates.setState(from, { estado: 'esperando_cuenta', bloqueado: false });
              return;
            }
      
            // Registrar el número de teléfono
            const registroValido = await loginRegistrarUsuario(numero, numeroInterno, cuentaResponse, cliente);
            console.log('📝 Registro de usuario:', registroValido, "NRO INTERNO: ",numeroInterno);
      
            if (!registroValido) {
              await sock.sendMessage(from, { text: mensajesCliente.registro_error_general  });
      
              // Reiniciar el estado del usuario
              userStates.setState(from, { estado: 'esperando_cuenta', bloqueado: false });
              return;
            }
      
            console.log('✅ Usuario registrado exitosamente:', numero);
            await sock.sendMessage(from, { text: mensajesCliente.felicitaciones_registro });
      
            // Limpiar el estado del usuario
            userStates.clearState(from);
          } catch (error) {
            console.error('🛑 Error al validar la clave:', error);
            await sock.sendMessage(from, { text: mensajesCliente.registro_clave_error });
      
            // Reiniciar el estado del usuario
            userStates.setState(from, { estado: 'esperando_cuenta', bloqueado: false });
          }
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


      const coope = id
      const coopeNumero = parseInt(coope, 10);
      console.log("============================= ACA VALIDO EL USUARIO: " + cta + "-" + text + "-" + coope + "-" + config.cliente + "-" + coopeNumero + " =========================================")

      


      if (config.apiPropietaria === true) {
        if (config.cliente != coope) {
          console.log("😢 Cliente no autorizado")
          await sock.sendMessage(from, { text: "😢 " + mensajes.noAutorizado });
          return
        }
        //console.log('✅ Usuario autorizado:', numero);
        // Detectar si el mensaje contiene una imagen solo para maximo paz
      
        if (msg.message.imageMessage && config.cliente === "05") {
          console.log('📷 Mensaje con imagen detectado para cliente 05 (Maximo Paz) dentro del comando "pizarra". Procesando subida...');
          if (msg.message.imageMessage.mimetype === 'image/jpeg' || msg.message.imageMessage.mimetype === 'image/png') {
            await subirmercado(sock, from, text, msg, cta); // Llama al comando de subida SFTP
            return;
          }
        }

      }
      if (!text) {
        //console.log('⚠️ No se recibió texto válido.');
        return;
      }
      if (!id) {
        
        await sock.sendMessage(from, { text: "😢 " + mensajes.noAutorizado });
        return
      }
      const cuenta = cta;
      const nombreSocio = nombre

      console.log('📦 -------------------------> Usuario:', numero + "| Cliente: " + coope + " |  Cuenta: "+ cuenta + " | Nombre Socio: " + nombreSocio + " <-----------------------------------");

      /*const comandosPorCliente = {
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
      };*/
      const comandosPorCliente = {
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
          
          solicitarDinero,
          '7': solicitarDinero,


          contacto,
          '8': contacto,

          salir,
          '9': salir,
          'salir': salir,
          /*
        */
        },
        '12':{
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
          salir,
          '8': salir,
        },
        'default': {
          menu,
          'menu': menu,
          '0': menu,
          info,
          'info': info,
          '1': info,
          pesos,
          'pesos': pesos,
          '2': pesos,
        },

      };


     
      const comandos = comandosPorCliente[coope] || comandosPorCliente['default'];
      //console.log('🔍 Comandos disponibles para este usuario:', comandos);
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

      // Manejo de comandos en estado "preguntar_tipo_transferencia"
      if (userState.estado) {
        console.log('📍 El usuario está en un flujo específico:', userState.estado);
        if (userState.estado === 'preguntar_tipo_transferencia' ||
            userState.estado === 'preguntar_cantidad_dinero' ||
            userState.estado === 'preguntar_cbu' ||
            userState.estado === 'preguntar_sucursal' ||
            userState.estado === 'preguntar_fecha_acreditacion' ||
            userState.estado === 'confirmar_solicitud') {
          await handlePedidoDeFondos(sock, from, text, userState, numero, numeroInterno,cuenta);
          return;
        }
      }
      // Manejo de comandos en estado "pedido_fondos"
      if (userState.estado === 'reserva_cereales') {
        //await handleResumenCereales(sock, from, text, userState);
        //return;
      }



      // Detectar y ejecutar comando
      const comandoDetectado = detectarComando(text, Object.keys(comandos));

      if (comandoDetectado) {
        if ( comandoDetectado === '7'  ) {
          // Setear el estado del usuario a "solicitud_fondos"
          userStates.setState(from, { estado: 'preguntar_tipo_transferencia', bloqueado: true, comandoActual: '7' });
          const userState = userStates.getState(from); // Obtener el estado actualizado
          console.log(`📍 Punto de control -> Estado actual: ${userState.estado}`);
  
          await handlePedidoDeFondos(sock, from, text, userState, numero, numeroInterno, cuenta);
      
        
        }
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




function normalizeText(msg) {
  console.dir(msg, { depth: null }); // Para depurar la estructura del mensaje

  const m = msg.message;

  // Ignorar mensajes de protocolo (eliminados, modo desaparición, etc.)
  if (m?.protocolMessage) return '';

  // Ignorar reacciones (pueden procesarse aparte si es necesario)
  if (m?.reactionMessage) return '';

  // Ignorar mensajes de stickers (sin texto)
  if (m?.stickerMessage) return '';

  // Ignorar audios sin transcripción
  if (m?.audioMessage && !m.audioMessage.caption) return '';

  // Extraer texto de múltiples tipos de mensajes
  const text =
    m?.extendedTextMessage?.text ?? // Mensajes con texto extendido
    m?.conversation ?? // Mensajes de texto simples
    m?.imageMessage?.caption ?? // Texto en imágenes
    m?.videoMessage?.caption ?? // Texto en videos
    m?.documentMessage?.caption ?? // Texto en documentos
    m?.buttonsResponseMessage?.selectedButtonId ?? // Respuesta a botones
    m?.listResponseMessage?.title ?? // Respuesta a listas
    m?.templateButtonReplyMessage?.selectedId ?? // Respuesta a botones de plantilla
    m?.pollUpdateMessage?.name ?? // Nombre de encuestas
    m?.audioMessage?.caption ?? // Texto en audios
    m?.contactMessage?.displayName ?? // Nombre en contactos
    m?.locationMessage?.name ?? // Nombre en ubicaciones
    '';
  //console.log('📨 :::: Texto extraído: "%s"', text);
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
    //console.log('🔍 Comando completo ficha cereales:', comandoCompleto);
    await fichacereal(sock, from, comandoCompleto, userState);
  } else if (tipo === 'r' && userState.opcionesRomaneos[`R${numero}`]) {
    const { cereal, clase, cosecha, cereal_codigo } = userState.opcionesRomaneos[`R${numero}`];
    const comandoCompleto = `R ${cereal} ${clase} ${cosecha} ${cereal_codigo}`;
    //console.log('🔍 Comando completo ficha romaneos:', comandoCompleto);
    await ficharomaneos(sock, from, comandoCompleto, userState);
  } else {
    // Si el texto no es válido, enviar un mensaje de error
    await sock.sendMessage(getCleanId(from), { text: mensajes.comando_desconocido });
  }

  
  

}


async function handlePedidoDeFondos(sock, from, text, userState, numeroCelu, numeroInterno, cuenta) {
 
 
 
  console.log('📍 Punto de control en handlePedidoDeFondos - Estado actual:',  numeroCelu, numeroInterno, cuenta) ;
  const tipo = text[0]?.toLowerCase(); // Primer carácter del texto
  const numero = text.slice(1); // Resto del texto
  const imagen = fs.readFileSync(config.clienteRobotImg);
  let msgCli = await cargarMensajesCliente(parseInt(config.cliente, 10));
  
   


  if (userState.estado === 'preguntar_tipo_transferencia') {
    console.log('📥 Comando recibido para tipo de transferencia:', text);
    let tra= "";
    
    console.log('📍 Punto de control en preguntar_tipo_transferencia - Antes de traerTransacciones-> ',numeroCelu, numeroInterno, cuenta, config.cliente)  ;
    const transacciones = await traerTransacciones(numeroCelu, numeroInterno, cuenta, config.cliente);
    // Mapeo de transacciones a un objeto de opciones
    let opciones = {};
    tra = transacciones.message.transacciones;

    if (tra && tra.length > 0) {
      opciones = tra.reduce((acc, transaccion, index) => {
        acc[index + 1] = {
          descripcion: transaccion.descripcion, // Descripción para mostrar al usuario
          idTransaccion: transaccion.idTransaccion, // ID para enviar al backend
        };
        return acc;
      }, {});
   

      // Agregar la opción de "Salir"

      opciones[tra.length + 1] = 'Salir';
    } else {
      console.log('⚠️ No se encontraron transacciones disponibles.');
    }
    let comSalirNum = tra.length + 1
 // Comando "salir" para salir del flujo
  
 
    const seleccion = opciones[tipo];
    
    
    if (!seleccion) {
      console.log('❌ Comando inválido:', text);
    //  await sock.sendMessage(from, { text: msgCli.sf_ingrese_una_opcion_valida });
      return;
    }
    const descripcionSeleccionada = seleccion.descripcion;
    const idTransaccionSeleccionada = seleccion.idTransaccion;
    console.log('✅ ID de transacción seleccionada:', idTransaccionSeleccionada, descripcionSeleccionada);
    
    if (seleccion === 'Salir' ) {
      console.log('🔙 El usuario ha salido del flujo de transferencias.');
      userStates.setState(from, { estado: null, bloqueado: false }); // Limpiar el estado
      await sock.sendMessage(from, { text: msgCli.sf_salida_flujo_transferencias });
      return;
    }
    userStates.setState(from, { ...userState, bloqueado: true, 
      tipoTransferencia: descripcionSeleccionada, 
      tipoTransferenciaCodigo:idTransaccionSeleccionada, 
      comandoActual: '7',  estado: 'preguntar_cantidad_dinero' });
    await sock.sendMessage(from, { text: `🤖 Tipo de operación seleccionada:\n ${descripcionSeleccionada}.` });
    await sock.sendMessage(from, { text: msgCli.sf_pregunta_cantidad_dinero}); ;
    return;
  }


  if (userState.estado === 'preguntar_cantidad_dinero') {
    console.log('📥 Comando recibido para cantidad de dinero:', text);
    // Normalizar el texto ingresado
    const textoNormalizado = text.replace(/,/g, '').trim(); // Eliminar comas y espacios
    const cantidad = parseFloat(textoNormalizado);
  
    if (isNaN(cantidad) || cantidad <= 0) {
      await sock.sendMessage(from, { text: msgCli.sf_ingrese_cantidad_valida });
      return;
    }
  
    // Manejo de cantidad de dinero
    if (userState.tipoTransferencia === 'Transferencias Bancarias' || userState.tipoTransferencia === 'Transferencia Bancaria' || userState.tipoTransferencia === 'Transferencia' || userState.tipoTransferencia === 'Transferencias') {
      
      let cbus = await traerCbusPorCuenta(numeroCelu, numeroInterno, cuenta, config.cliente);
      console.log('📍 Punto de control en preguntar_cbu - Antes de traerCbusPorCuenta -> ', numeroCelu, numeroInterno, cuenta, config.cliente);
      if (cbus?.message?.cbu?.length > 0) {
        let cbus_msg = "💳 CBUS asociados a SU cuenta:\n\n";
        cbus_msg += `Seleccione la cuenta destino para la transferencia ingresando el número correspondiente:\n\n`;
        cbus.message.cbu.forEach((item, index) => {
          cbus_msg += `✅ ${index + 1} - Banco: ${item.bancoNombre}\n`;
          cbus_msg += `💳 CBU: **********${item.cbu.slice(-10)}\n`; // Mostrar solo los últimos 10 caracteres
          cbus_msg += `-----------------------------\n`;
        });
        console.log('✅ CBUs obtenidos correctamente.', cbus_msg);
  
        // Enviar la lista de CBUs al usuario
        await sock.sendMessage(from, { text: cbus_msg });
  
        // Actualizar el estado del usuario para esperar la selección del CBU
        userStates.setState(from, {
          ...userState,
          bloqueado: true,
          cantidadDinero: cantidad,
          estado: 'preguntar_cbu',
          cbus: cbus.message.cbu, // Guardar la lista de CBUs en el estado
        });
        return;
      } else {
        console.warn('⚠️ No se encontraron CBUs asociados a la cuenta.');
        await sock.sendMessage(from, { text: '❌ No se encontraron CBUs asociados a su cuenta.' });
        return;
      }
    }
  
    if (userState.tipoTransferencia === 'Cheque' || userState.tipoTransferencia === 'Cheques') {

      console.log('📍 Punto de control en preguntar_sucursal - Antes de traerSucursales -> ', numeroCelu, numeroInterno, cuenta, config.cliente);

      let sucursales = await traerSucursales(numeroCelu, numeroInterno, cuenta, config.cliente);
  
      if (sucursales?.message?.sucursales?.length > 0) {
        let suc_msg = "🏦 Sucursales disponibles:\n\n";
        suc_msg += "Seleccione la sucursal donde retirará el cheque ingresando el número correspondiente:\n\n";
  
        sucursales.message.sucursales.forEach((item, index) => {
          suc_msg += `✅ ${index + 1} - ${item.nombre}\n`;
        });
  
        console.log('✅ Sucursales obtenidas correctamente.', suc_msg);
  
        // Enviar la lista de sucursales al usuario
        await sock.sendMessage(from, { text: suc_msg });
  
        // Actualizar el estado del usuario para esperar la selección de la sucursal
        userStates.setState(from, {
          ...userState,
          bloqueado: true,
          cantidadDinero: cantidad,
          estado: 'preguntar_sucursal',
          sucursales: sucursales.message.sucursales, // Guardar la lista de sucursales en el estado
        });
        return;
      } else {
        console.warn('⚠️ No se encontraron sucursales disponibles.');
        await sock.sendMessage(from, { text: '❌ No se encontraron sucursales disponibles para el retiro del cheque.' });
        return;
      }
    }

    
    





  
    // Actualizar el estado del usuario para avanzar al siguiente paso
    userStates.setState(from, { ...userState, bloqueado: true, cantidadDinero: cantidad, estado: 'preguntar_fecha_acreditacion' });
    await sock.sendMessage(from, { text: `🤖 Ha Ingresado: $ ${cantidad}.` });
    await sock.sendMessage(from, { text: msgCli.sf_pregunta_fecha_acreditacion });
    return;
  }




  if (userState.estado === 'preguntar_sucursal') {
    console.log('📥 Comando recibido para selección de sucursal:', text);
  
    const seleccion = parseInt(text.trim(), 10); // Convertir la selección a número
    const sucursales = userState.sucursales;
    console.log('📍 Punto de control en preguntar_sucursal - Seleccionada -> ', seleccion);
    if (isNaN(seleccion) || seleccion < 1 || seleccion > sucursales.length) {
      await sock.sendMessage(from, { text: '❌ Opción inválida. Por favor, seleccione un número de la lista.' });
      return;
    }
  
    // Obtener la sucursal seleccionada
    const sucursalSeleccionada = sucursales[seleccion - 1];
    console.log('✅ Sucursal seleccionada:', sucursalSeleccionada);
  
    // Guardar la sucursal seleccionada en el estado del usuario
    userStates.setState(from, {
      ...userState,
      bloqueado: true,
      sucursalSeleccionadaNombre: sucursalSeleccionada.nombre,
      sucursalSeleccionadaCodigo: sucursalSeleccionada.idSucursal,
      estado: 'preguntar_fecha_acreditacion', // Continuar con el flujo
    });
  
    await sock.sendMessage(from, {
      text: `✅ Ha seleccionado la sucursal: ${sucursalSeleccionada.nombre}.\n\nPor favor, ingrese la fecha de acreditación en el formato "YYYY-MM-DD".`,
    });
    return;
  }
  
  if (userState.estado === 'preguntar_cbu') {
    console.log('📥 Comando recibido para selección de CBU:', text);
  
    const seleccion = parseInt(text.trim(), 10); // Convertir la selección a número
    const cbus = userState.cbus;
  
    if (isNaN(seleccion) || seleccion < 1 || seleccion > cbus.length) {
      await sock.sendMessage(from, { text: '❌ Opción inválida. Por favor, seleccione un número de la lista.' });
      return;
    }
  
    // Obtener el CBU seleccionado
    const cbuSeleccionado = cbus[seleccion - 1];
    console.log('✅ CBU seleccionado:', cbuSeleccionado);
  
    // Guardar el banco seleccionado en el estado del usuario
    userStates.setState(from, {
      ...userState,
      bloqueado: true,
      bancoSeleccionado: cbuSeleccionado.bancoNombre,
      bancoSeleccionadoCodigo: cbuSeleccionado.idBanco,
      cbuSeleccionado: cbuSeleccionado.cbu,
      cbuIdPadron: cbuSeleccionado.idCbuPadron,
      estado: 'preguntar_fecha_acreditacion', // Continuar con el flujo
    });


  
    await sock.sendMessage(from, {
      text: `✅ Ha seleccionado el banco: ${cbuSeleccionado.bancoNombre}\n💳 CBU: **********${cbuSeleccionado.cbu.slice(-5)}\n\nPor favor, ingrese la fecha de acreditación en el formato "YYYY-MM-DD".`,
    });
    return;
  }
 
  if (userState.estado === 'preguntar_fecha_acreditacion') {
    console.log('📥 Comando recibido para fecha de acreditación:', text);
  
    // Validar el formato de la fecha
    const fechaRegex = /^\d{4}-\d{2}-\d{2}$/; // Formato YYYY-MM-DD
    if (!fechaRegex.test(text)) {
      await sock.sendMessage(from, {
        text: '❌ Formato de fecha inválido. Por favor, ingrese la fecha en el formato "YYYY-MM-DD" (por ejemplo, 2025-10-22).'
      });
      return;
    }
  
    // Validar si la fecha es válida
    const fechaAcreditacion = new Date(text);
    if (isNaN(fechaAcreditacion.getTime())) {
      await sock.sendMessage(from, {
        text: '❌ Fecha inválida. Por favor, ingrese una fecha válida en el formato "YYYY-MM-DD".'
      });
      return;
    }
  
    // Validar que sea mayor a hoy + 48 horas
    const ahora = new Date();
    const fechaMinima = new Date(ahora.getTime() + 48 * 60 * 60 * 1000); // hoy + 48 hs
  
    if (fechaAcreditacion <= fechaMinima) {
      const fechaMinimaStr = fechaMinima.toISOString().split('T')[0];
      await sock.sendMessage(from, {
        text: `⚠️ La fecha ingresada debe ser posterior a ${fechaMinimaStr} (72 horas desde ahora). Por favor, ingrese una nueva fecha válida.`
      });
      return;
    }
  
    // Actualizar el estado del usuario
    userStates.setState(from, {
      ...userState,
      bloqueado: true,
      fechaAcreditacion: text,
      estado: 'confirmar_solicitud'
    });
  
    console.log('✅ Fecha de acreditación ingresada:', text);
  
    await sock.sendMessage(from, {
      text: `🤖 Fecha de acreditación ingresada: ${text}. \n\n¿Desea confirmar la solicitud? Responda con "Sí" o "No".`
    });
    return;
  }
  

  if (userState.estado === 'confirmar_solicitud') {

    let transaccion = false;
    const respuesta = text.trim().toLowerCase();
    let conSucu = ""
    let codSucu = 0
    let sep = "---------------------------------------"
    console.log('📍 :: Punto de control en confirmar_solicitud - Antes de confirmarPedidoDeFondos ->', numeroCelu, numeroInterno, cuenta, userState.tipoTransferenciaCodigo, codSucu, userState.cantidadDinero, userState.fechaAcreditacion, config.cliente);
    if (userState.sucursalSeleccionadaCodigo){
      conSucu = `\n- Sucursal de Cobro: ${userState.sucursalSeleccionadaNombre}`
      codSucu = userState.sucursalSeleccionadaCodigo
    }
    if (respuesta === 'sí' || respuesta === 'si') {
      //numero, numeroInterno, cuenta, tipo, cantidad, fechaAcreditacion, coope)
      await sock.sendMessage(from, {
        text: msgCli.sf_solicitud_procesando,
      });
      let idChequera = 0;
      transaccion = await confirmarPedidoDeFondos(numeroCelu, numeroInterno, cuenta, userState.tipoTransferenciaCodigo, codSucu,userState.cantidadDinero, userState.fechaAcreditacion, userState.cbuSeleccionado, userState.bancoSeleccionadoCodigo,  idChequera, config.cliente);
      if (transaccion.code === 'OK' && (transaccion.status === 200  || transaccion.status === 201)){
        let msg_banco = ""
        if (userState.tipoTransferencia === 'Transferencias Bancarias' || userState.tipoTransferencia === 'Transferencias'){ 
          msg_banco = "- "+userState.bancoSeleccionado+"\n- CBU: **********"+userState.cbuSeleccionado.slice(-5)+"\n"
        }else{
          msg_banco = ""
        }
        let sep = "\n--------------------------------------------------\n"
        const nroOrdenFmt = String(transaccion.nro_orden).padStart(10, '0');
        if (config.mensajesConLogo === 'S') {
          if (transaccion.status === 201){
            await sock.sendMessage(from, { image: imagen, caption:  transaccion.respuesta+"\n"});
      
          }else  {
            await sock.sendMessage(from, { image: imagen, caption:  transaccion.respuesta+"\n"+`${sep}- Nro de Orden: ${nroOrdenFmt}\n${msg_banco}- Operación: ${userState.tipoTransferencia}${conSucu}\n- Cantidad: $ ${userState.cantidadDinero}\n- Fecha de acreditación: ${userState.fechaAcreditacion}${sep}\nPuede consultar el estado de sus operaciones ingresando el comando *'operaciones'*\n\n${msgCli.sf_solicitud_condiciones}\n\n🤖 👍 Gracias por usar nuestro servicio.\n\n_${config.clienteNombre}_\n\n\Escriba *'menu'* para volver al menu principal` });
          }
        } else {
          if (transaccion.status === 201){
            await sock.sendMessage(from, {
              text: transaccion.respuesta+"\n"
            });
        } else {
          await sock.sendMessage(from, {
            text: transaccion.respuesta+"\n"+`${sep}- Nro de Orden: ${str(nroOrdenFmt).zfill(10)}\n${msg_banco}- Operación: ${userState.tipoTransferencia}${conSucu}\n- Cantidad: $ ${userState.cantidadDinero}\n- Fecha de acreditación: ${userState.fechaAcreditacion}${sep}\nPuede consultar el estado de sus operaciones ingresando el comando *'operaciones'*\n\n${msgCli.sf_solicitud_condiciones}\n\n 🤖 👍 Gracias por usar nuestro servicio.\n\n_${config.clienteNombre}_\n\n\Escriba *'menu'* para volver al menu principal` 
          });
        }
        }


       
      } else {
          await sock.sendMessage(from, {
            text: msgCli.sf_solicitud_error,
          });
        
      }

  
      // Limpiar el estado del usuario
      userStates.setState(from, { estado: null });
    } else if (respuesta === 'no') {
      console.log('❌ Solicitud cancelada.');
      await sock.sendMessage(from, {
        text: '❌ Su solicitud ha sido cancelada.\n\n Si desea realizar otra operación, escriba *"menu"*.',
      });
      
      // Limpiar el estado del usuario
      userStates.setState(from, { estado: null , bloqueado: false });
      await sock.sendMessage(from, {
        text: 'Puede escribir *"menu"* para volver al menu principal.',
      });
    } else {
      console.log('❓ Respuesta no válida:', text);
      await sock.sendMessage(from, {
        text: 'Por favor, responda con *"Sí"* para confirmar o *"No"* para cancelar.',
      });
    }
    return;
  }

 



  // Si el texto no es válido, enviar un mensaje de error
  console.log('❌ Comando desconocido en handlePedidoDeFondos:', text);
  await sock.sendMessage(getCleanId(from), { text: mensajes.comando_desconocido });
}



async function cargarMensajesCliente(coopeId) {
  console.log("cargarMensajesCliente("+coopeId+")");
  const codigo = clientesCodigo[coopeId];
  console.log("cargarMensajesCliente("+coopeId+") -> "+codigo);
  if (!codigo) return mensajes;
  const ruta = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    '..',
    'mensajes',
    `${codigo}.js`
  );
 
 
  return fs.existsSync(ruta) ? (await import(ruta)).default : mensajes;
}


export default { startBot, sockInstance };