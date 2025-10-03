const axios = require('axios');
const path = require('path');
const { m, verificarUsuarioValido } = require('../../services/apiCliente');
const { config, clientesCodigo } = require('../config');
const mensajes = require('../../bot/mensajes/default');
const mensajesCoopaz = require('../../bot/mensajes/05');
const { getCleanId, extraerNumero , descargarImagenRemota} = require('../utils');



module.exports = async (sock, from, nroCuenta) => {
  await sock.sendMessage(from, { text: "⏳"+mensajes.mensaje_aguarde});
  try {
    const jid = from;
    const numero = extraerNumero(jid);
    const validacion = await verificarUsuarioValido(numero, config.cliente);
    if (!validacion || !validacion.usuario) {
      await sock.sendMessage(from, { text: mensajes.numero_no_asociado });
      userStates.clearState(from); // Limpiar el estado del usuario
      return;
    }

    const usuario = validacion.usuario;
    const cuenta = usuario.cuenta;
    const coope = usuario.coope;







    
    if (coope === 5) {
      const imageUrl = 'http://www.maximopazcoop.com.ar/i/pizarra.jpg';
      const imageBuffer = await descargarImagenRemota(imageUrl);
      //const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      



      await sock.sendMessage(jid, {
        image: imageBuffer,
        caption: '📊 Pizarra de cereales actualizada.\n\n_Escribí *menu* para volver al menú principal._'
      });
    } else {
      await sock.sendMessage(from, { text: mensajesCoopaz.error_comando });
    }

  } catch (error) {
    await sock.sendMessage(from, {
      text: mensajes.mercado_cereales_disponible_sin_datos + " " + error.message
    });
  }
};