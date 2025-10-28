import { config, clientesCodigo } from '../config.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { extraerNumero } from '../utils.js';
import userStates from '../userStates.js';
import apiCliente from '../../services/apiCliente.js';
const { verificarUsuarioValido, traerTransacciones } = apiCliente;
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

export default async (sock, from, nroCuenta, text) => {
  console.log('📥 Entrando a solicitar dinero : ' + text);
  const mensajesCliente = await cargarMensajesCliente(parseInt(config.cliente, 10));
  await sock.sendMessage(from, { text: `⏳ ${mensajesCliente.mensaje_aguarde}` });

  try {
    const jid = from;
    const numero = extraerNumero(jid);
    const imagen = fs.readFileSync(config.clienteRobotImg);

    // Verificar si el usuario es válido
    const validacion = await verificarUsuarioValido(numero, config.cliente);
    
    if (!validacion || !validacion.usuario) {
      await sock.sendMessage(from, { text: mensajesCliente.numero_no_asociado });
      userStates.clearState(from); // Limpiar el estado del usuario
      return;
    }
   
    let comando = '0';
    // Configurar el estado inicial del flujo
    if (config.cliente == "11") {
      comando = '7';
    }else if (config.cliente == "05") {
      comando = '7';
        }
    // defino la chequera por defecto
  
    userStates.setState(from, { estado: 'preguntar_tipo_transferencia', comandoActual:comando });
    // Obtener las transacciones disponibles
    let tra = "";
    try {
      console.log("::: SolicitarDinero: --> Usuario validado:", numero, validacion.usuario.ident_unico_whatsupp, validacion.usuario.cuenta, config.cliente);
      const transacciones = await traerTransacciones(numero, validacion.usuario.ident_unico_whatsupp, validacion.usuario.cuenta, config.cliente);
      tra = transacciones.message.transacciones
      console.log("Transacciones obtenidas: ", transacciones.message.transacciones);
    } catch (error) {
      console.log("Error al obtener transacciones:", error);
    }
    
   
    console.log(":::::::::::::: TRA: ", tra);
    // Crear el mensaje inicial
    /*let mensaje = '🤖 *Solicitud de Dinero*\n\n';
    mensaje += '¿Qué tipo de operación desea realizar?\n';
    mensaje += '1️⃣ Transferencia\n';
    mensaje += '2️⃣ Cheque\n';
    mensaje += '3️⃣ Cheque electrónico\n';
    mensaje += '4️⃣ Salir\n';
*/
    // Crear el mensaje inicial
    let mensaje = '🤖 *Solicitud de Dinero*\n\n';
    mensaje += '¿Qué tipo de operación desea realizar?\n';

    // Verificar si hay transacciones disponibles
    if (tra && tra.length > 0) {
      tra.forEach((transaccion, index) => {
        mensaje += `${index + 1}️⃣ ${transaccion.descripcion}\n`;
      });
      mensaje += `${tra.length + 1}️⃣ Salir\n`; // Agregar la opción de salir
    } else {
      mensaje += '⚠️ No se encontraron transacciones disponibles.\n';
    }
    

    // Enviar el mensaje inicial
    if (config.mensajesConLogo === 'S') {
      console.log("Enviando mensaje con logo -> ", mensaje);
      await sock.sendMessage(from, { image: imagen, caption: mensaje });
    } else {
      console.log("Enviando mensaje sin logo -> ", mensaje);
      await sock.sendMessage(from, { text: mensaje });
    }
  } catch (error) {
    console.error('🛑 Error en solicitarDinero:', error);
    await sock.sendMessage(from, { text: mensajesCliente.error_obtencion_saldos });
    userStates.clearState(from); // Limpiar el estado del usuario en caso de error
  }
};