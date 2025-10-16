export async function manejarRegistroUsuario({ from, text, sock, numero, numeroInterno, cliente, validacion, userStates, mensajes }) {
  console.log(`🔐 Iniciando proceso de registro para:`, numero);
  const userState = userStates.getState(from) || {};
  
    // Si ya está validado, no hacer nada
    if (validacion["usuario"] && typeof validacion["usuario"] === "object") return;
  
    // Si no tiene estado, iniciar registro
    if (!userState.estado) {
      console.log(`[${new Date().toISOString()}] ❌ Usuario no autorizado:`, numero);
      await sock.sendMessage(from, {
        text: "❌ 😢 No estás registrado como asociado.\n\nPor favor, ingresa tu número de cuenta asociada proporcionado por la Cooperativa para poder validar tu usuario."
      });
      userStates.setState(from, { estado: 'esperando_cuenta', bloqueado: false });
      return;
    }
  
    // Esperando número de cuenta
    if (userState.estado === 'esperando_cuenta') {
      if (userState.bloqueado) return console.log('⏳ Usuario ya está en proceso de validación, esperando respuesta...');
  
      const cuentaResponse = text.trim();
      if (!cuentaResponse) {
        await sock.sendMessage(from, { text: "⚠️ No detectamos ningún número de cuenta. Intenta nuevamente." });
        return;
      }
  
      console.log(`[${new Date().toISOString()}] 📨 Cuenta recibida:`, cuentaResponse);
      userStates.setState(from, { ...userState, bloqueado: true });
      await sock.sendMessage(from, { text: "⏳ Validando datos, aguarde..." });
  
      const cuentaValida = await loginValidarCuenta(cuentaResponse);
      if (!cuentaValida) {
        await sock.sendMessage(from, { text: "❌ 😢 Número de cuenta inválido. Intenta nuevamente." });
        userStates.setState(from, { estado: 'esperando_cuenta', bloqueado: false });
        return;
      }
  
      await sock.sendMessage(from, { text: `🔒 Por favor, ingresa tu clave para la cuenta ${cuentaResponse}` });
      userStates.setState(from, { estado: 'esperando_clave', cuenta: cuentaResponse, bloqueado: false });
      return;
    }
  
    // Esperando clave
    if (userState.estado === 'esperando_clave') {
      if (userState.bloqueado) return console.log('⏳ Usuario ya está en proceso de validación, esperando respuesta...');
  
      const claveResponse = text.trim();
      if (!claveResponse) {
        await sock.sendMessage(from, { text: "⚠️ No detectamos ninguna clave. Intenta nuevamente." });
        return;
      }
  
      console.log(`[${new Date().toISOString()}] 📨 Clave recibida:`, claveResponse);
      userStates.setState(from, { ...userState, bloqueado: true });
      await sock.sendMessage(from, { text: "⏳ Validando datos, aguarde..." });
  
      const claveValida = await login(userState.cuenta, claveResponse);
      if (!claveValida) {
        await sock.sendMessage(from, {
          text: "❌ 🔑 Clave inválida. Intenta nuevamente.\n\nSi no recuerda su clave, póngase en contacto con la Cooperativa"
        });
        userStates.setState(from, { estado: 'esperando_clave', bloqueado: false });
        return;
      }
  
      const registroValido = await loginRegistrarUsuario(numero, numeroInterno, userState.cuenta, cliente);
      if (!registroValido) {
        await sock.sendMessage(from, { text: "❌ 🤖 Error al registrar el usuario. Intenta nuevamente por favor." });
        userStates.setState(from, { estado: 'esperando_cuenta', bloqueado: false });
        return;
      }
  
      console.log(`[${new Date().toISOString()}] ✅ Usuario registrado exitosamente:`, numero);
      await sock.sendMessage(from, { text: mensajes.felicitaciones_registro });
      userStates.setState(from, null);
    }
  }
  
export default {manejarRegistroUsuario};

  