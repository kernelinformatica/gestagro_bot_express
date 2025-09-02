const mensajes = require('../../bot/mensajes');
const mensajesCaur = require('../../bot/mensajes/03');
const mensajesCoopaz = require('../../bot/mensajes/05');
const mensajesMarga= require('../../bot/mensajes/06');
const { getCleanId, extraerNumero } = require('../utils');
const { verificarUsuarioValido } = require('../../services/apiCliente');
module.exports = async (sock, from, text, msg) => {
   const jid = from;
   const numero = extraerNumero(jid);
   const cuenta = "0"



   


  // Verificar si el usuario es válido
  try {
    const validacion = await verificarUsuarioValido(numero);
    const usuario = validacion['usuario'];
    const [id, cta] = usuario;
    const coope = id; 
    if (!validacion || !validacion.usuario) {

      await sock.sendMessage(from, { text: mensajes.numero_no_asociado });
      return;
    }
    if (coope === "03"){
      // menu para caur
       response = mensajesCaur.menu
     }else if (coope === "05"){
      // menu para coopaz
       response = mensajesCoopaz.menu
    }else if (coope === "06"){
        // menu para coopaz
         response = mensajesMarga.menu
    }else{
      // menu para gestagro
       response = mensajes.menu
    }
    await sock.sendMessage(from, { text: response });

  } catch (error) {
  
    await sock.sendMessage(from, {
      text: mensajes.error_solicitud
    });
  }
}