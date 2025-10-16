import { config, clientesCodigo } from '../config.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { extraerNumero } from '../utils.js';
import apiCliente from '../../services/apiCliente.js';
const { verificarUsuarioValido } = apiCliente;
import mensajesDefault from '../mensajes/default.js';

// Función para cargar mensajes personalizados del cliente
async function cargarMensajesCliente(coopeId) {
  const codigo = clientesCodigo[coopeId];
  if (!codigo) return mensajesDefault;
  const ruta = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    '..',
    'mensajes',
    `${codigo}.js`
  );
 
  return fs.existsSync(ruta) ? (await import(ruta)).default : mensajesDefault;
}

export default async (sock, from, text, msg) => {
  const mensajesCliente = await cargarMensajesCliente(parseInt(config.cliente, 10));
  await sock.sendMessage(from, { text: `⏳ ${mensajesCliente.mensaje_aguarde}` });

  const jid = from;
  const numero = extraerNumero(jid);

  try {
    // Validar usuario
    const validacion = await verificarUsuarioValido(numero, config.cliente);
    if (!validacion?.usuario) {
      await sock.sendMessage(from, { text: mensajesCliente.numero_no_asociado });
      return;
    }

    // Datos del usuario
    const [id] = validacion.usuario.coope;
    const nombre = validacion.usuario.nombre;
    const coopeCli = parseInt(config.cliente, 10);

    // Cargar mensajes personalizados

    console.log('Mensajes cargados:', mensajesCliente);
    const response = mensajesCliente.menu;
    
    // Enviar mensaje con o sin logo según configuración
    if (config.mensajesConLogo === 'S') {
      await sock.sendMessage(from, { image: { url: config.clienteRobotImg }, caption: `👋 Hola ${nombre}\n\n${mensajesCliente.menu}` });
    } else {
      await sock.sendMessage(from, { text: response });
    }
  } catch (error) {
    console.error('Error al procesar mensaje:', error);
    await sock.sendMessage(from, { text: `${mensajesDefault.error_solicitud} | ${error}` });
  }
};