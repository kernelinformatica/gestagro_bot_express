
const { obtenerSaldo, verificarUsuarioValido } = require('../../services/apiCliente');
const mensajes = require('../../bot/mensajes/default');
const { getCleanId, extraerNumero } = require('../utils');
const { config } = require('../config');
const fs = require('fs'); 

module.exports = async (sock, from, nroCuenta = "0") => {
  try {
    const jid = from;
    const numero = extraerNumero(jid);
    const cuenta = "0"
    // Verificar si el usuario es válido
    const imagen = fs.readFileSync(config.clienteRobotImg);
    const validacion = await verificarUsuarioValido(numero);
    if (!validacion || !validacion.usuario) {
      await sock.sendMessage(from, { text: messajes.numero_no_asociado });
      return;
    }
    
    // Obtener el saldo en dólares
    const resp = await obtenerSaldo(numero, "USD", cuenta);

    if (config.mensajesConLogo == "S"){
      await sock.sendMessage(from, { image: imagen, caption: resp.message  });
    }  else{
      await sock.sendMessage(from, { text: resp.message });
    }



   
    

   
  } catch (error) {
    await sock.sendMessage(from, { text: mensajes.error_obtencion_saldos});
  }
};