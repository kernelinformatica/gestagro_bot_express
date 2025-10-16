import { config, clientesCodigo } from '../config.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { extraerNumero } from '../utils.js';
import apiCliente from '../../services/apiCliente.js';
const { verificarUsuarioValido, obtenerSaldo } = apiCliente;
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

export default async (sock, from, nroCuenta= "0") => {
  const mensajesCliente = await cargarMensajesCliente(parseInt(config.cliente, 10));
  await sock.sendMessage(from, { text: `⏳ ${mensajesCliente.mensaje_aguarde}` });
  try {
    console.log('📥 Entrando a comando ccpesos : ');


    const jid = from
    const numero = extraerNumero(jid);
    const validacion = await verificarUsuarioValido(numero, config.cliente);
    const cuenta = "0"
    const logo = fs.readFileSync(config.clienteLogo);
    const imagen = fs.readFileSync(config.clienteRobotImg);
    if (!validacion || !validacion.usuario) {
      await sock.sendMessage(from, { text: mensajes.numero_no_asociado });
      userStates.clearState(from); // Limpiar el estado del usuario
      return;
    }
    console.log(':: Solicitando saldo en pesos :: ');
    const saldo = await obtenerSaldo( numero, "PES", cuenta);


    if (config.mensajesConLogo == "S"){
      await sock.sendMessage(from, { image: imagen, caption: saldo.message  });
    }  else{
      await sock.sendMessage(from, { text: saldo.message });
    }




   
  } catch {
    await sock.sendMessage(from, { text: mensajes.error_obtencion_saldos });
  }
};