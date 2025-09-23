const { obtenerSaldo, verificarUsuarioValido } = require('../../services/apiCliente');
const mensajes = require('../mensajes/default');
const axios = require('axios');
const { getCleanId, extraerNumero } = require('../utils');
const fs = require('fs');
const FormData = require('form-data');
const api = require('../config').api;
module.exports = async (sock, from, nroCuenta = "0") => {
  try {
    const jid = from;
    const numero = extraerNumero(jid);
   
    // Verificar si el usuario es válido
    const validacion = await verificarUsuarioValido(numero);
    const usuario = validacion['usuario'];
    const [id, cta] = usuario;
    const cuenta = cta;
    const coope = parseInt(id, 10); 
    
    const tipo = "resumen-ctacte"; 
    if (!validacion || !validacion.usuario) {
      await sock.sendMessage(from, { text: mensajes.numero_no_asociado });
      return;
    }

    // Llamada a la API para generar el PDF con parámetros
    const pdfResponse = await axios.post(api.URL_REPORTES_PDF, {
      coope: coope,
      cuenta: cuenta,
      tipo: tipo,
    }, {
      responseType: 'stream', // Asumimos que devuelve el archivo directamente
    });

    // Guardar temporalmente el PDF
    const tempPath = './pdfs/'+cuenta+'-ctacte-pesos-temp.pdf';
    const writer = fs.createWriteStream(tempPath);
    pdfResponse.data.pipe(writer);

    writer.on('finish', async () => {
      // Enviar el archivo como un mensaje adjunto
      const pdfBuffer = fs.readFileSync(tempPath); // Leer el archivo como buffer
      await sock.sendMessage(from, {
        document: pdfBuffer,
        mimetype: 'application/pdf',
        fileName: cuenta+'-resumen-de-cuenta.pdf',
      });

      await sock.sendMessage(from, { text: mensajes.menu_respuesta_descarga });

      // Eliminar el archivo temporal después de enviarlo
      fs.unlinkSync(tempPath);
    });

    writer.on('error', async (error) => {
      console.error('Error al guardar el PDF:', error);
      await sock.sendMessage(from, { text: mensajes.error_obtencion_resumen_ctacte });
    });

  } catch (error) {
    console.error('Error al generar/enviar el PDF:', error);
    await sock.sendMessage(from, { text: mensajes.error_obtencion_resumen_ctacte });
  }
};