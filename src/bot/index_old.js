const makeWASocket = require('@whiskeysockets/baileys');
const { useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const Boom = require('@hapi/boom');
const qrcode = require('qrcode-terminal');
const info = require('./commands/info'); // Importa el archivo ayuda.js
const ayuda = require('./commands/ayuda'); // Importa el archivo ayuda.js
const pesos = require('./commands/ccpesos'); // Importa el archivo ccpesos.js
const pesosresumen = require('./commands/ccpesosresumen');
const dolar = require('./commands/ccdolar'); // Importa el archivo ccdolar.js
const dolarresumen = require('./commands/ccdolarresumen'); // Importa el archivo ccdolarresumen.js
const resucer = require('./commands/resucer'); // Importa el archivo ccdolar.js
const disponible = require('./commands/disponible'); // Importa el archivo ccdolar.js
const futuro = require('./commands/futuro'); // Importa el archivo ccdolar.js
const porDefecto = require('./commands/default'); // Importa el archivo default.js
const { handleMessage } = require('./handlers');
const pino = require('pino');
const userStates = require('./userStates'); // Importa el módulo userStates
const fichacereal = require('./commands/fichacer');
const cotizaciones = require('./commands/cotizabna'); 
const ficharomaneos = require('./commands/ficharom');
const ficharom = require('./commands/ficharom');
const test = require('./commands/test'); // Importa el comando test
const reiniciarempresa  = require('./commands/reiniciarempresa'); // Importa el comando reiniciarempresa
const chatgpt = require('./commands/chatgpt'); // Importa el comando chatgpt
const logger = pino({ level: 'debug' });

let sockInstance = null;

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth');

  const sock = makeWASocket.default({ auth: state });
  sockInstance = sock;

  sock.ev.on('creds.update', saveCreds);
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

  


  
  const processedMessages = new Set(); // Set global para evitar duplicados

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    const msg = messages[0];

    // Ignorar mensajes del sistema o enviados por el propio bot
    if (!msg.message || msg.key.fromMe || msg.key.remoteJid === 'status@broadcast') {
      return; // Salir si el mensaje es del sistema o enviado por el bot
    }
    if (!msg.message || msg.key.fromMe) return;
    const messageID = msg.key.id;
    if (processedMessages.has(messageID)) return; // Ya lo procesamos
    processedMessages.add(messageID); // Marcar como procesado
    
    const from = msg.key.remoteJid ?? '';
    const text =
    msg.message?.conversation ??
    msg.message?.extendedTextMessage?.text ??
    msg.message?.imageMessage?.caption ??
    msg.message?.videoMessage?.caption ??
    msg.message?.documentMessage?.caption ??
    msg.message?.documentMessage?.notify ??
    msg.message?.buttonsResponseMessage?.selectedButtonId ??
    msg.message?.listResponseMessage?.title ?? null;
    

    
  
    console.log(`📩 Mensaje recibido de ${from}: ${text}: ${type}`);
  
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
      '99':reiniciarempresa
    };
  
   
    const textoRaw = msg.message?.extendedTextMessage?.text;
    const texto = (text ?? '').toString().trim();
    
    
    if (texto !== '' && texto !== null) {
      console.log('📝 Texto recibido:', texto);
    } else {
      console.log('⚠️  No se recibió texto válido.');
      return;
    }
    
    /*if (text.toLowerCase().startsWith('chatgpt')) {
      const mensaje = text.slice(4).trim(); 
      await gpt2(sock, from, mensaje);
      return;
    }*/ 

    
    const userState = userStates.getState(from);
    console.log('🔍 Estado del usuario:', userState?.estado);
    console.log('📦 user state:', userState);
    
    
    
    if (userState?.estado === 'seleccion_empresa') {
      const seleccion = parseInt(text, 10);
    
      if (isNaN(seleccion) || seleccion < 1 || seleccion > userState.empresas.length) {
        await sock.sendMessage(from, { text: '⚠️ Selección inválida. Por favor, responda con un número válido.' });
        return;
      }
    
      const empresaSeleccionada = userState.empresas[seleccion - 1];
      const cuentaSeleccionada = empresaSeleccionada.cuenta; // Obtener la cuenta asociada a la empresa seleccionada
    
      console.log('🔍 Empresa seleccionada:', empresaSeleccionada);
    
      // Actualizar el estado del usuario con la empresa y la cuenta seleccionadas
      userStates.setState(from, {
        ...userState,
        estado: null, // Limpiar el estado de selección
        empresaSeleccionada,
        cuentaSeleccionada, // Guardar la cuenta seleccionada
      });
      console.log('🔍 Estado del usuario actualizado:', userStates.getState(from));
      await sock.sendMessage(from, { text: `✅ Ha seleccionado la empresa: ${empresaSeleccionada.nombre}` });
    
      // Retomar el comando pendiente
      const comandoPendiente = userState.comandoPendiente;
      if (comandoPendiente) {
        console.log('🔄 Retomando el comando pendiente:', comandoPendiente);
        const { comando, argumentos } = comandoPendiente;
    
        // Ejecutar el comando pendiente
        if (comandos[comando]) {
          await comandos[comando](sock, from, argumentos);
        } else {
          await sock.sendMessage(from, { text: '⚠️ No se pudo retomar el comando pendiente.' });
        }
      }
    
      return;
    }




    //console.log('🔍 Estado del usuario:', userState?.estado+" | "+text);
    if (userState?.estado === 'resumen_cereales' && text.toLowerCase().startsWith('f')) {
      // romaneos pendientes
      /*const partes = text.split(/\s+/);
      const numero = partes[1]; // Obtener el número después de "F"
      console.log('🔍 Número de ficha:', numero);

        if (userState.opcionesFicha[numero]) {
          const { cereal, clase, cosecha } = userState.opcionesFicha[numero];
          
          // Construir el comando completo
          const comandoCompleto = `F ${cereal} ${clase} ${cosecha}`;
          console.log('🔍 Comando completo ficha cereales:', comandoCompleto);

          // Delegar la ejecución a fichacer.js
          await fichacereal(sock, from, comandoCompleto, userState);
          return;
        } else {
          await sock.sendMessage(from, { text: '⚠️ Opción inválida para descargar la ficha de cereales. Por favor, selecciona un número válido.' });
          return;
        }*/
          const numero = text.slice(1); // Obtener el número después de "F"
          console.log('🔍 Número de ficha:', numero);
        
          if (userState.opcionesFicha[`F${numero}`]) {
            const { cereal, clase, cosecha } = userState.opcionesFicha[`F${numero}`];
        
            // Construir el comando completo
            const comandoCompleto = `F ${cereal} ${clase} ${cosecha}`;
            console.log('🔍 Comando completo ficha cereales:', comandoCompleto);
        
            // Delegar la ejecución a fichacereal.js
            await fichacereal(sock, from, comandoCompleto, userState);
            return;
            } else {
              await sock.sendMessage(from, { text: '⚠️ Opción inválida para descargar la ficha de cereales. Por favor, selecciona un número válido.' });
              return;
            }
    } else if(userState?.estado === 'resumen_cereales' && text.toLowerCase().startsWith('r')) {  
        // romaneos pendientes
        /*const partes = text.split(/\s+/);
        const numero = partes[1]; 

        if (userState.opcionesRomaneos[numero]) {
          const { cereal, clase, cosecha } = userState.opcionesRomaneos[numero];
          
          const comandoCompleto = `r ${cereal} ${clase} ${cosecha}`;
          console.log('🔍 Comando completo ficha romaneos:', comandoCompleto);

          await ficharomaneos(sock, from, comandoCompleto, userState);
          return;
        } else {
          await sock.sendMessage(from, { text: '⚠️ Opción inválida para descargar la ficha de romaneos. Por favor, selecciona un número válido.' });
          return;
        }*/
          const numero = text.slice(1); // Obtener el número después de "F"
          console.log('🔍 Número de ficha de romaneos:', numero);
        
          if (userState.opcionesFicha[`F${numero}`]) {
            const { cereal, clase, cosecha } = userState.opcionesFicha[`F${numero}`];
        
            // Construir el comando completo
            const comandoCompleto = `F ${cereal} ${clase} ${cosecha}`;
            console.log('🔍 Comando completo ficha romaneos:', comandoCompleto);
        
            // Delegar la ejecución a fichacereal.js
            await ficharomaneos(sock, from, comandoCompleto, userState);
            return;
            } else {
              await sock.sendMessage(from, { text: '⚠️ Opción inválida para descargar la ficha de romaneos. Por favor, selecciona un número válido.' });
              return;
            }
    } else {
        const comandosValidos = Object.keys(comandos);
        const partes = text.trim().split(/\s+/); // separa por espacios
        const comandoPrincipal = partes[0].toLowerCase(); // primer palabra
        const comandoDetectado = detectarComando(text, comandosValidos);
        const argumentos = text.trim().split(/\s+/).slice(1);
        console.log('🔍 Comando detectado:', comandoDetectado);
      
        if (comandoDetectado) {
          await comandos[comandoDetectado](sock, from, text, msg, argumentos);
        } else {
          await porDefecto(sock, from, text, msg, argumentos);
        }
    }

    
  });
}

function detectarComando(texto, comandosValidos) {
  const palabras = texto.toLowerCase().split(/\s+/);
  return palabras.find(p => comandosValidos.includes(p)) ?? null;
}

module.exports = { startBot, sockInstance };