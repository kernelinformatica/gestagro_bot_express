const { loginDesconectar, verificarUsuarioValido } = require('../../services/apiCliente');
const mensajes = require('../../bot/mensajes/default');
const fs = require('fs'); 
const userStates = require('../userStates'); 
const { getCleanId, extraerNumero } = require('../utils');
const { config } = require('../config');
module.exports = async (sock, from, nroCuenta= "0") => {
  try {
    await sock.sendMessage(from, { text: "⏳"+mensajes.mensaje_aguarde });
    const jid = from
    const numero = extraerNumero(jid);
    const cuenta = "0"
    const logo = fs.readFileSync(config.clienteLogo);
    const imagen = fs.readFileSync(config.clienteRobotImg);
    // Verificar si el usuario es válido
    const validacion = await verificarUsuarioValido(numero, config.cliente);
    
    if (!validacion || !validacion.usuario) {
      await sock.sendMessage(from, { text: mensajes.numero_no_asociado });
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