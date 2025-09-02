const { obtenerSaldo, verificarUsuarioValido } = require('../../services/apiCliente');
const mensajes = require('../../bot/mensajes');
const userStates = require('../userStates'); 
const { getCleanId, extraerNumero } = require('../utils');
module.exports = async (sock, from, nroCuenta= "0") => {
  try {
    const jid = from
    const numero = extraerNumero(jid);
    const cuenta = "0"
    // Verificar si el usuario es válido
    const validacion = await verificarUsuarioValido(numero);
    console.log("Validacion usuario en ccpesos:", validacion);
    if (!validacion || !validacion.usuario) {
      await sock.sendMessage(from, { text: mensajes.numero_no_asociado });
      return;
    }
    const saldo = await obtenerSaldo( numero, "PES", cuenta);
    await sock.sendMessage(from, { text: saldo.message });
  } catch {
    await sock.sendMessage(from, { text: mensajes.error_obtencion_saldos });
  }
};