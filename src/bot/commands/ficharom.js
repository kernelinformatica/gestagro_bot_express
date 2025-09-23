const mensajes = require('../mensajes/default');
const axios = require('axios');
const fs = require('fs');
const { verificarUsuarioValido } = require('../../services/apiCliente');
const { buscarCodigoCereal } = require('../utils'); // Ruta correcta
const { getCleanId, extraerNumero } = require('../utils');
const api = require('../config').api;
const { config } = require('../config');
module.exports = async (sock, from, text, userState) => {
  try {
    const jid = from;
    const numero = extraerNumero(jid);
    console.log('📥 Entrando a ficha romaneos pendientes');
    console.log('📦 Parámetros recibidos:', { from, text, userState });
    const validacion = await verificarUsuarioValido(numero);
    const usuario = validacion['usuario'];
    const [id, cta] = usuario;
    const cuenta = cta;
    const coope = parseInt(id, 10); 
    const imagen = fs.readFileSync(config.clienteRobotImg);
    const partes = text.split(/\s+/); // Dividir el comando en partes
    if (partes.length < 4) {
      console.log('⚠️ Comando incompleto:', partes);
      await sock.sendMessage(from, {
        text: '⚠️ Comando incompleto.*',
      });
      return;
    }

    const cereal = partes[1];
    const clase = partes[2]; // Tercer elemento es la clase
    const cosechaRaw = partes[3]; // Cuarto elemento es la cosecha
    const coopesConCosechaSinBarra = ["01", "09", "12", "15", "17", "20", "23", "29"];
    cosecha = coopesConCosechaSinBarra.includes(coope)
    ? `${cosechaRaw}`
    : `${cosechaRaw.slice(0, 2)}/${cosechaRaw.slice(2)}`;
    console.log('✅ Parámetros extraídos:', { cereal, clase, cosecha });

    // Tipo fijo
    const tipo = 'ficha-romaneo';

    // Log de parámetros
    console.log(
      `:: Ficha de cereales parametros recibidos -> cereal: ${cereal}, clase: ${clase}, cosecha: ${cosecha}, tipo: ${tipo}`
    );
   
    
    
    // Llamada a la API
    const pdfResponse = await axios.post(
      api.URL_REPORTES_PDF,
      {
        coope,
        cuenta,
        cereal,
        clase,
        cosecha,
        tipo,
      },
      {
        responseType: 'stream',
      }
    );

    // Guardar temporalmente el PDF
    const tempPath = `./pdfs/${from}-ficha-romaneo-temp.pdf`;
    const writer = fs.createWriteStream(tempPath);
    pdfResponse.data.pipe(writer);

    writer.on('finish', async () => {
      console.log('✅ PDF generado con éxito.');
      // Enviar el archivo como un mensaje adjunto
      const pdfBuffer = fs.readFileSync(tempPath); // Leer el archivo como buffer
      await sock.sendMessage(from, {
        document: pdfBuffer,
        mimetype: 'application/pdf',
        fileName: `ficha-romaneos-`+cereal+"-"+clase+"-"+cosechaRaw+`.pdf`,
      });

      await sock.sendMessage(from, { text: mensajes.menu_respuesta_descarga  });


     

      // Eliminar el archivo temporal después de enviarlo
      fs.unlinkSync(tempPath);
    });

    writer.on('error', async (error) => {
      console.error('Error al guardar el PDF:', error);
      await sock.sendMessage(from, { text: mensajes.error_obtencion_ficha_romaneos });
    });
  } catch (error) {
    console.error('Error al generar/enviar el PDF:', error);
    await sock.sendMessage(from, { text: mensajes.error_obtencion_ficha_romaneos });
  }
};