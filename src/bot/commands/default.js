const { response } = require('express');
const mensajes = require('../../bot/mensajes');
const mensajesCaur = require('../../bot/mensajes/03');
const mensajesCoopaz = require('../../bot/mensajes/05');
const mensajesMarga = require('../../bot/mensajes/06');

const { m, verificarUsuarioValido } = require('../../services/apiCliente');
const {getCleanId} = require('../utils');
const {extraerNumero} = require('../utils');
module.exports = async (sock, from, text, msg) => {
  
  try {
    const jid = from
    const numero = extraerNumero(jid);
    // Verificar si el usuario es válido
    const validacion = await verificarUsuarioValido(numero);
    const usuario = validacion['usuario'];
    const [id, cta, nombre] = usuario;
    const nombreSocio = usuario[3].split(' ').slice(1).join(' ');
    const coope = id; 
    const cuerpo_1="🤖 HOLA"
    if (!validacion || !validacion.usuario) {
     
      await sock.sendMessage(getCleanId(from), { text: mensajes.numero_no_asociado });
      return;
    }
    //await sock.sendMessage(from, { text: `${respuesta}\n\n${mensajes.menu}` });
    if (coope === "03"){
      // menu para caur
       resp = cuerpo_1+" "+nombreSocio+" 👋 \n\n"+mensajesCaur.menu
       respError = mensajesCaur.error_solicitud
    }else if (coope === "05"){
       resp = cuerpo_1+" "+nombreSocio+" 👋 \n\n"+mensajesCoopaz.menu
       respError = mensajesCaur.error_solicitud
      }else if (coope === "06"){
        resp = cuerpo_1+" "+nombreSocio+" 👋 \n\n"+mensajesMarga.menu
        respError = mensajesMarga.error_solicitud   
    }else{
       resp = cuerpo_1+" "+nombreSocio+" 👋 \n\n"+mensajes.menu
       respError = mensajes.error_solicitud
    }
    await sock.sendMessage(getCleanId(from), { text: `${resp}` });
  } catch (error) {
    await sock.sendMessage(getCleanId(from), { text: mensajes.respError });
  }

  
};
