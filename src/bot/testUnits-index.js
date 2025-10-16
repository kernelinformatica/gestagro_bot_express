// 📦 Importaciones ESM
import { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
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
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log(`Conexión cerrada. ¿Reconectar? → ${shouldReconnect}`);

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

      const from = msg.key.remoteJid ?? '';
      const text = normalizeText(msg);

      console.log(`📩 Mensaje recibido de ${from}: ${text}`);

      // Aquí continúa toda tu lógica original, incluyendo validación de usuario, manejo de comandos, etc.
      // Mantengo el objeto comandosPorCliente intacto
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
          '99': reiniciarempresa,
        },
        // ...resto de los clientes
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
          '99': reiniciarempresa,
        },
      };

      // Aquí continúa el resto de tu lógica
    } catch (error) {
      console.error('🛑 Error procesando mensaje:', error);
      await sock.sendMessage(getCleanId(from), { text: '❌ Ocurrió un error al procesar su solicitud. Intente nuevamente más tarde.' });
    }
  });
}

// Normalizar texto recibido
function normalizeText(msg) {
  const m = msg.message;

  if (m?.protocolMessage || m?.reactionMessage || m?.stickerMessage) return '';
  if (m?.audioMessage && !m.audioMessage.caption) return '';

  return (
    m?.conversation ??
    m?.extendedTextMessage?.text ??
    m?.imageMessage?.caption ??
    m?.videoMessage?.caption ??
    m?.documentMessage?.caption ??
    m?.buttonsResponseMessage?.selectedButtonId ??
    m?.listResponseMessage?.title ??
    m?.audioMessage?.caption ??
    m?.contactMessage?.displayName ??
    m?.locationMessage?.name ??
    ''
  ).trim().toLowerCase();
}

module.exports = { startBot, sockInstance };