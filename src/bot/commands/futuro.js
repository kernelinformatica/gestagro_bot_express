const { m, obtenerMercadoCereales, verificarUsuarioValido } = require('../../services/apiCliente');
const mensajes = require('../../bot/mensajes/default');
const { getCleanId, extraerNumero } = require('../utils');
const { config } = require('../config');
const fs = require('fs'); 
module.exports = async (sock, from, nroCuenta) => {
  try {
    const jid = from
    const numero = extraerNumero(jid);
    const mercado = 'futuro'
    const imagen = fs.readFileSync(config.clienteRobotImg);
    const validacion = await verificarUsuarioValido(numero);
    if (!validacion || !validacion.usuario) {
        await sock.sendMessage(from, { text: mensajes.numero_no_asociado });
        return;
      }
    const futuro = await obtenerMercadoCereales( numero, mercado);



    if (config.mensajesConLogo == "S"){
      await sock.sendMessage(from, { image: imagen, caption: futuro.message  });
    }  else{
      await sock.sendMessage(from, { text: futuro.message });
    }

    
    
  } catch (error) {
   
    await sock.sendMessage(from, { text: mensajes.mercado_cereales_futuros_sin_datos +" "+ error.message});
  }
};