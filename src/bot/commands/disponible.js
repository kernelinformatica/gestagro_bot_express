const { m, obtenerMercadoCereales, verificarUsuarioValido } = require('../../services/apiCliente');
const mensajes = require('../../bot/mensajes/default');
const { getCleanId, extraerNumero } = require('../utils');
const { config } = require('../config');
const fs = require('fs'); 
module.exports = async (sock, from, nroCuenta) => {
  try {
    const jid = from
    const numero = extraerNumero(jid);
    const mercado = 'disponible'
    const imagen = fs.readFileSync(config.clienteRobotImg);
    // Verificar si el usuario es válido
    const validacion = await verificarUsuarioValido(numero);
    if (!validacion || !validacion.usuario) {
      await sock.sendMessage(from, { text: mensajes.numero_no_asociado });
      return;
    }
    const disp = await obtenerMercadoCereales( numero, mercado);
    
    if (config.mensajesConLogo == "S"){
      await sock.sendMessage(from, { image: imagen, caption: disp.message  });
    }  else{
      await sock.sendMessage(from, { text: disp.message });
    }
    
    

  } catch (error) {
    await sock.sendMessage(from, { text: mensajes.mercado_cereales_disponible_sin_datos +" "+ error.message });
  }
};