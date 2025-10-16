import { config, clientesCodigo } from '../config.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { extraerNumero } from '../utils.js';
import apiCliente from '../../services/apiCliente.js';
const { verificarUsuarioValido, obtenerMercadoCereales } = apiCliente;
import mensajesDefault from '../mensajes/default.js';

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
  const mensajesCliente = await cargarMensajesCliente(parseInt(config.cliente, 10));
    await sock.sendMessage(from, { text: `⏳ ${mensajesCliente.mensaje_aguarde}` });
  try {
    const jid = from
    const numero = extraerNumero(jid);
    const mercado = 'disponible'
    const imagen = fs.readFileSync(config.clienteRobotImg);
    // Verificar si el usuario es válido
    const validacion = await verificarUsuarioValido(numero, config.cliente);
    if (!validacion || !validacion.usuario) {
      await sock.sendMessage(from, { text: mensajesCliente.numero_no_asociado });
      userStates.clearState(from); // Limpiar el estado del usuario
      return;
    }

    const usuario = validacion.usuario;
    const cuenta = usuario.cuenta;
    const coope = usuario.coope;
    const disp = await obtenerMercadoCereales( numero, mercado);
    
    if (config.mensajesConLogo == "S"){
      await sock.sendMessage(from, { image: imagen, caption: disp.message  });
    }  else{
      await sock.sendMessage(from, { text: disp.message });
    }
    
    

  } catch (error) {
    await sock.sendMessage(from, { text: mensajesCliente.mercado_cereales_disponible_sin_datos +" "+ error.message });
  }
};