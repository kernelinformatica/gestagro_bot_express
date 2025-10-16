
import { config, clientesCodigo, api } from '../config.js';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { fileURLToPath } from 'url';
import { extraerNumero , generarIconosNumericos, buscarCodigoCereal, formatterPrecios} from '../utils.js';
import userStates from '../userStates.js';
import apiCliente from '../../services/apiCliente.js';
const { verificarUsuarioValido, loginDesconectar } = apiCliente;
import mensajesDefault from '../mensajes/default.js';
const iconosNumericos = generarIconosNumericos(50);



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


export default async (sock, from, nroCuenta= "0") => {
  const mensajesCliente = await cargarMensajesCliente(parseInt(config.cliente, 10));
      await sock.sendMessage(from, { text: `⏳ ${mensajesCliente.mensaje_aguarde}` });
  
  try {
    await sock.sendMessage(from, { text: "🔌 Desvinculando, aguarde..."});
     const mensajesCliente = cargarMensajesCliente(parseInt(config.cliente, 10));

      const jid = from
      const numero = extraerNumero(jid);
      const cuenta = "0"
      const logo = fs.readFileSync(config.clienteLogo);
      const imagen = fs.readFileSync(config.clienteRobotImg);
    // Verificar si el usuario es válido

    const validacion = await verificarUsuarioValido(numero, config.cliente);
    if (!validacion || !validacion.usuario) {
      await sock.sendMessage(from, { text: mensajesCliente.numero_no_asociado });
      return;
    }
   
    const salir = await loginDesconectar( numero, cuenta);

    
    if (config.mensajesConLogo == "S"){
        await sock.sendMessage(from, { text: salir });
        //await sock.sendMessage(from, { image: imagen, caption: salir  });
    }  else{
      await sock.sendMessage(from, { text: salir });
    }
   
  } catch(error) {
    console.error('Error al procesar mensaje:', error);
    await sock.sendMessage(from, { text: "No se pudo procesar la desvinculación, intente nuevamente más tarde" +" | "+error  });
  }
};