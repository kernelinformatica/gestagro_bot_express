
const { config, clientesCodigo } = require('../config');
const fs = require('fs');
const path = require('path');
const { extraerNumero } = require('../utils');
const { verificarUsuarioValido } = require('../../services/apiCliente');
const mensajesDefault = require('../mensajes/default');




function cargarMensajesCliente(coopeId) {
  const codigo = clientesCodigo[coopeId];
  if (!codigo) return mensajesDefault;

  const ruta = path.join(__dirname, '..', 'mensajes', `${codigo}.js`);
  return fs.existsSync(ruta) ? require(ruta) : mensajesDefault;
}
module.exports = async (sock, from, text, msg) => {
  await sock.sendMessage(from, { text: "⏳"+mensajes.mensaje_aguarde});
  try {
    console.log('📥 Entrando a comando info');
    const jid = from
    const numero = extraerNumero(jid);
    // Verificar si el usuario es válido
    const validacion = await verificarUsuarioValido(numero, config.cliente);
    if (!validacion || !validacion.usuario) {
      await sock.sendMessage(from, { text: mensajes.numero_no_asociado });
      userStates.clearState(from); // Limpiar el estado del usuario
      return;
    }

    const usuario = validacion.usuario;
    const cuenta = usuario.cuenta;
    const coope = usuario.coope;

    const nombreSocio = usuario[3].split(' ').slice(1).join(' ');
    const cuerpo_1 = "🤖 HOLA"
    const imagen = fs.readFileSync(config.clienteRobotImg);
 
    if (!validacion || !validacion.usuario) {

      await sock.sendMessage(getCleanId(from), { text: mensajesDefault.numero_no_asociado });
      return;
    }
  
    const mensajesCliente = cargarMensajesCliente(coope);
    const response =  mensajesCliente.gestagro;
    console.log('📥 info()');
 
    if (config.mensajesConLogo == "S"){
      await sock.sendMessage(from, { image: imagen, caption: `${response}`});
    }  else{
      await sock.sendMessage(from, { text: `${response}` });
     
      
      
    }


  } catch (error) {
    await sock.sendMessage(getCleanId(from), { text: mensajesDefault.error_general });
  }




};