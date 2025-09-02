const { verificarUsuarioValidoPorEmpresa, obtenerSaldo } = require('../../services/apiCliente');
const userStates = require('../userStates');

module.exports = async (sock, from, text) => {
  try {
    const jid = from;
    const numeroFull = jid.split('@')[0];
    const numero = numeroFull.slice(3);

    // Verificar si el usuario ya seleccionó una empresa
    const userState = userStates.getState(from);
    if (userState?.empresaSeleccionada) {
      console.log('🔍 Empresa ya seleccionada:', userState.empresaSeleccionada);

      // Continuar con el flujo normal usando la empresa seleccionada
      const cuenta = userState.cuentaSeleccionada;
      const coope = userState.empresaSeleccionada.id;

      console.log(`Usuario validado: cuenta=${cuenta}, coope=${coope}`);

      const saldo = await obtenerSaldo(numero, 'PES', cuenta);
      await sock.sendMessage(from, { text: saldo.message });
      return;
    }

    // Si no hay empresa seleccionada, verificar las empresas asociadas
    const validacion = await verificarUsuarioValidoPorEmpresa(numero, sock, from, {
      comando: 'test',
      argumentos: text,
    });

    if (!validacion) {
      // Si `verificarUsuarioValido` devuelve null, esperar la selección de la empresa
      console.log('Esperando selección de empresa por parte del usuario.');
      return;
    }
   
    // Guardar la empresa seleccionada en el estado del usuario
    userStates.setState(from, { ...userState, empresaSeleccionada: validacion, cuentaSeleccionada: validacion.cuenta });

    const cuenta = validacion.cuenta;
    const coope = validacion.coope;

    // Continuar con el flujo normal
    console.log(`Usuario validado: cuenta=${cuenta}, coope=${coope}`);

    const saldo = await obtenerSaldo(numero, 'PES', cuenta);
    await sock.sendMessage(from, { text: saldo.message });
  } catch (error) {
    console.error('Error en test.js:', error);
    await sock.sendMessage(from, { text: '❌ Ocurrió un error al procesar su solicitud. Intente nuevamente más tarde.' });
  }
};