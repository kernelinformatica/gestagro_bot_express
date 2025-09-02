const { m, obtenerMercadoCereales, verificarUsuarioValido } = require('../../services/apiCliente');
const mensajes = require('../../bot/mensajes');
const { getCleanId, extraerNumero } = require('../utils');
module.exports = async (sock, from, nroCuenta) => {
  try {
    const jid = from
    const numero = extraerNumero(jid);
    const mercado = 'disponible'
    // Verificar si el usuario es válido
    const validacion = await verificarUsuarioValido(numero);
    if (!validacion || !validacion.usuario) {
      await sock.sendMessage(from, { text: mensajes.numero_no_asociado });
      return;
    }
    const saldo = await obtenerMercadoCereales( numero, mercado);
    await sock.sendMessage(from, { text: saldo.message });
  } catch (error) {
    await sock.sendMessage(from, { text: mensajes.mercado_cereales_disponible_sin_datos +" "+ error.message });
  }
};