const axios = require('axios');
const path = require('path');
const { m, verificarUsuarioValido } = require('../../services/apiCliente');


const mensajes = require('../../bot/mensajes/default');
const mensajesCoopaz = require('../../bot/mensajes/05');
const { getCleanId, extraerNumero , descargarImagenRemota} = require('../utils');



module.exports = async (sock, from, nroCuenta) => {
  try {
    const jid = from;
    const numero = extraerNumero(jid);
    const validacion = await verificarUsuarioValido(numero);
    const usuario = validacion['usuario'];
    const [id, cta] = usuario;
    const cuenta = cta;
    const coope = parseInt(id, 10);

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