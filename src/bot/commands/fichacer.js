const mensajes = require('../mensajes/default');
const axios = require('axios');
const fs = require('fs');
const { getCleanId, extraerNumero } = require('../utils');
const { verificarUsuarioValido } = require('../../services/apiCliente');
const { buscarCodigoCereal } = require('../utils'); // Ruta correcta
const api = require('../config').api;
const { config } = require('../config');
const { Console } = require('console');

function normalizarCoope(coope) {
  return String(coope).trim().padStart(2, "0");
}

function obtenerCosecha(coope, cosechaRaw) {
  const coopesSinBarra = ["01", "09", "12", "15", "17", "20", "23", "29"];
  const coopeNorm = normalizarCoope(coope);
  return coopesSinBarra.includes(coopeNorm)
    ? `${cosechaRaw}`
    : `${cosechaRaw.slice(0, 2)}/${cosechaRaw.slice(2)}`;
}

module.exports = async (sock, from, text, userState) => {
  await sock.sendMessage(from, { text: "⏳" + mensajes.mensaje_aguarde });
  try {
    const jid = from;
    const numero = extraerNumero(jid);

    // Verificar si el usuario es válido
    const validacion = await verificarUsuarioValido(numero, config.cliente);
    if (!validacion || !validacion.usuario) {
      await sock.sendMessage(from, { text: mensajes.numero_no_asociado });
      userStates.clearState(from); // Limpiar el estado del usuario
      return;
    }

    const usuario = validacion.usuario;
    const cuenta = usuario.cuenta;
    const coope = usuario.coope;

    // Dividir el comando en partes

    const partes = text.split(/\s+/);
    if (partes.length < 4) {
      console.log('⚠️ Comando incompleto:', text);
      await sock.sendMessage(from, {
        text: '⚠️ Comando incompleto. Uso correcto: F+numero cereal clase cosecha',
      });
      return;
    }
    console.log('✅ Parámetros extraídos:', { partes });
    //const cereal = partes[1];
    const cereal = partes[4];
    const clase = partes[2];
    const cosechaRaw = partes[3];
   

    const cosecha = obtenerCosecha(coope, cosechaRaw);

    console.log(
      `:: Ficha de cereales parámetros para enviar -> cereal: ${cereal}, clase: ${clase}, cosecha: ${cosecha}, cuenta: ${cuenta}`
    );

    // Llamada a la API para generar el PDF
    
    const pdfResponse = await axios.post(
      api.URL_REPORTES_PDF,
      {
        coope,
        cuenta,
        cereal,
        clase,
        cosecha,
        tipo: 'ficha-cereal',
      },
      {
        responseType: 'stream',
      }
    );

    if (pdfResponse.status !== 200) {
      console.error('Error al generar el PDF:', pdfResponse.data);
      await sock.sendMessage(from, { text: mensajes.error_obtencion_ficha_cereales}, pdfResponse.status);
      return;
    }

    // Guardar temporalmente el PDF
    const tempPath = `./pdfs/${from}-ficha-cereales-temp.pdf`;
    const writer = fs.createWriteStream(tempPath);
    pdfResponse.data.pipe(writer);

    writer.on('finish', async () => {
      console.log('✅ PDF generado con éxito.');
      const pdfBuffer = fs.readFileSync(tempPath);

      // Enviar el archivo como un mensaje adjunto
      await sock.sendMessage(from, {
        document: pdfBuffer,
        mimetype: 'application/pdf',
        fileName: `ficha-cereales-${cereal}-${clase}-${cosechaRaw}.pdf`,
      });

      await sock.sendMessage(from, { text: mensajes.menu_respuesta_descarga });

      // Eliminar el archivo temporal después de enviarlo
      try {
        fs.unlinkSync(tempPath);
      } catch (unlinkError) {
        console.error('Error al eliminar el archivo temporal:', unlinkError);
      }
    });

    writer.on('error', async (error) => {
      console.error('Error al guardar el PDF:', error);
      await sock.sendMessage(from, { text: mensajes.error_obtencion_ficha_cereales, error });
    });
  } catch (error) {
    console.error('Error al generar/enviar el PDF:', error);
    await sock.sendMessage(from, { text: mensajes.error_obtencion_ficha_cereales, error });
  }
};