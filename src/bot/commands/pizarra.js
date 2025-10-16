import { config, clientesCodigo, api } from '../config.js';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';
import { extraerNumero , generarIconosNumericos, buscarCodigoCereal, descargarImagenRemota} from '../utils.js';
import userStates from '../userStates.js';
import apiCliente from '../../services/apiCliente.js';
import mensajesDefault from '../mensajes/default.js';
const { verificarUsuarioValido, obtenerResumenDeCereales } = apiCliente;
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

export default async (sock, from, nroCuenta) => {
  console.log('📥 Entrando a comando pizarra : '+config.cliente);
  //const mensajesCliente = cargarMensajesCliente(parseInt(config.cliente, 10));
  console.log('📥 Comando pizarra - mensajesCliente: ', config.cliente);
  const mensajesCliente = await cargarMensajesCliente(parseInt(config.cliente, 10));
  await sock.sendMessage(from, { text: `⏳ ${mensajesCliente.mensaje_aguarde}` });
  try {
    const jid = from;
    const numero = extraerNumero(jid);
    const validacion = await verificarUsuarioValido(numero, config.cliente);
    if (!validacion || !validacion.usuario) {
      await sock.sendMessage(from, { text: mensajesCliente.numero_no_asociado });
      userStates.clearState(from); // Limpiar el estado del usuario
      return;
    }

    const usuario = validacion.usuario;
    const cuenta = usuario.cuenta;
    const coope = usuario.coope;







    
    if (config.cliente === "05") {
      const imageUrl = 'http://www.maximopazcoop.com.ar/i/pizarra.jpg';
      const imageBuffer = await descargarImagenRemota(imageUrl);
      //const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      



      await sock.sendMessage(jid, {
        image: imageBuffer,
        caption: '📊 Pizarra de cereales actualizada.\n\n_Escribí *menu* para volver al menú principal._'
      });
    } else {
      await sock.sendMessage(from, { text: mensajesDefault.error_comando });
    }

  } catch (error) {
    await sock.sendMessage(from, {
      text: mensajesDefault.mercado_cereales_disponible_sin_datos + " " + error.message
    });
  }
};