const userStates = require('../userStates');
const { verificarUsuarioValidoPorEmpresa } = require('../../services/apiCliente');
const { getCleanId, extraerNumero } = require('../utils');
module.exports = async (sock, from, text) => {
  try {
    // Borrar el estado del usuario
    const userState = userStates.getState(from);
    userStates.clearState(from);
    console.log(`🔄 Estado del usuario borrado para: ${from}`);

    // Volver a preguntar qué empresa desea operar
    const numero = extraerNumero(jid);

    // Mantener el comando pendiente original
    const comandoPendiente = userState?.comandoPendiente;

    const validacion = await verificarUsuarioValidoPorEmpresa(numero, sock, from, comandoPendiente);

    if (!validacion) {
      console.log('Esperando selección de empresa por parte del usuario.');
      return;
    }

    // Si solo hay una empresa asociada, continuar directamente
    const cuenta = validacion.cuenta;
    const coope = validacion.id;

    console.log(`Usuario validado: cuenta=${cuenta}, coope=${coope}`);
    await sock.sendMessage(from, { text: `✅ Empresa seleccionada automáticamente: ${validacion.nombre}` });
  } catch (error) {
    console.error('Error en reiniciarempresa.js:', error);
    await sock.sendMessage(from, { text: '❌ Ocurrió un error al reiniciar el estado. Intente nuevamente más tarde.' });
  }
};