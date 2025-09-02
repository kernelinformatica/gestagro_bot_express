
const { obtenerSaldo, verificarUsuarioValido } = require('../../services/apiCliente');
const mensajes = require('../../bot/mensajes');
const { getCleanId, extraerNumero } = require('../utils');

module.exports = async (sock, from, nroCuenta = "0") => {
  try {
    const jid = from;
    const numero = extraerNumero(jid);
    const cuenta = "0"
    // Verificar si el usuario es válido
    const validacion = await verificarUsuarioValido(numero);
    if (!validacion || !validacion.usuario) {
      await sock.sendMessage(from, { text: messajes.numero_no_asociado });
      return;
    }
    
    // Obtener el saldo en dólares
    const resp = await obtenerSaldo(numero, "USD", cuenta);
    await sock.sendMessage(from, { text: resp.message });
   
    

   
  } catch (error) {
    await sock.sendMessage(from, { text: mensajes.error_obtencion_saldos});
  }
};