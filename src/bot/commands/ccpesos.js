const { obtenerSaldo, verificarUsuarioValido } = require('../../services/apiCliente');
const mensajes = require('../../bot/mensajes/default');
const fs = require('fs'); 
const userStates = require('../userStates'); 
const { getCleanId, extraerNumero } = require('../utils');
const { config } = require('../config');
module.exports = async (sock, from, nroCuenta= "0") => {
  try {
    const jid = from
    const numero = extraerNumero(jid);
    const cuenta = "0"
    const logo = fs.readFileSync(config.clienteLogo);
    const imagen = fs.readFileSync(config.clienteRobotImg);
    // Verificar si el usuario es válido
    const validacion = await verificarUsuarioValido(numero);
    console.log("Validacion usuario en ccpesos:", validacion);
    if (!validacion || !validacion.usuario) {
      await sock.sendMessage(from, { text: mensajes.numero_no_asociado });
      return;
    }
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