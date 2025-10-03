const { response } = require('express');
const mensajes = require('../../bot/mensajes/default');
const mensajesAcevedo = require('../../bot/mensajes/01');
const mensajesCaur = require('../../bot/mensajes/03');
const mensajesCoopaz = require('../../bot/mensajes/05');
const mensajesMarga = require('../../bot/mensajes/06');
const mensajesCoopar = require('../../bot/mensajes/11');
const mensajesGodoy = require('../../bot/mensajes/12');
const mensajesCrespo = require('../../bot/mensajes/29');
const { m, verificarUsuarioValido } = require('../../services/apiCliente');
const {getCleanId} = require('../utils');
const {extraerNumero} = require('../utils');
const { config } = require('../config');
module.exports = async (sock, from, text, msg) => {
  await sock.sendMessage(from, { text: "⏳"+mensajes.mensaje_aguarde});
  try {
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
   
    const cuerpo_1="🤖 HOLA"
    const imagen = fs.readFileSync(config.clienteRobotImg);
    if (!validacion || !validacion.usuario) {
     
      await sock.sendMessage(getCleanId(from), { text: mensajes.numero_no_asociado });
      return;
    }
    //await sock.sendMessage(from, { text: `${respuesta}\n\n${mensajes.menu}` });
    if (coope === 3){
      // menu para caur
       resp = cuerpo_1+" "+nombreSocio+" 👋 \n\n"+mensajesCaur.menu
       respError = mensajesCaur.error_solicitud
    }else if (coope === 1){
        // Menu para acevedo
        resp = cuerpo_1+" "+nombreSocio+" 👋 \n\n"+mensajesAcevedo.menu
        respError = mensajesAcevedo.error_solicitud
    }else if (coope === 5){
       resp = cuerpo_1+" "+nombreSocio+" 👋 \n\n"+mensajesCoopaz.menu
       respError = mensajesCaur.error_solicitud
      }else if (coope === 6){
        resp = cuerpo_1+" "+nombreSocio+" 👋 \n\n"+mensajesMarga.menu
        respError = mensajesMarga.error_solicitud   

   }else if (coope === 11){
        // menu para coopar
        resp = cuerpo_1+" "+nombreSocio+" 👋 \n\n"+mensajesCoopar.menu
        respError = men.error_solicitud  

      }else if (coope === 12){
        // menu para godoy
        resp = cuerpo_1+" "+nombreSocio+" 👋 \n\n"+mensajesGodoy.menu
        respError = men.error_solicitud      
  }else if (coope === 29){
          
          resp = cuerpo_1+" "+nombreSocio+" 👋 \n\n"+mensajesCrespo.menu
          respError = men.error_solicitud        
    }else{
       resp = cuerpo_1+" "+nombreSocio+" 👋 \n\n"+mensajesCrespo.menu
       respError = mensajes.error_solicitud
    }
   
    if (config.mensajesConLogo == "S"){
      await sock.sendMessage(from, { image: robot, caption: `${resp}`  });
    }  else{
      await sock.sendMessage(getCleanId(from), { text: `${resp}` });
    }

  } catch (error) {
    await sock.sendMessage(getCleanId(from), { text: mensajes.respError });
  }

  
};
