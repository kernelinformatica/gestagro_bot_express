const mensajes = require('../mensajes/default');
const axios = require('axios');
const fs = require('fs');
const { verificarUsuarioValido } = require('../../services/apiCliente');
const { buscarCodigoCereal } = require('../utils'); // Ruta correcta
const { getCleanId, extraerNumero } = require('../utils');
const api = require('../config').api;
const { config } = require('../config');
function normalizarCoope(coope) {
  const tipo = typeof coope;
  const limpio = String(coope).trim().padStart(2, "0");
  console.log(`>>> Coope recibido (${tipo}):`, coope);
  console.log(">>> Coope normalizado:", limpio);
  return limpio;
}

function obtenerCosecha(coope, cosechaRaw) {
  const coopesSinBarra = ["01", "09", "12", "15", "17", "20", "23", "29"];
  const coopeNorm = normalizarCoope(coope);
  const cosecha = coopesSinBarra.includes(coopeNorm)
    ? `${cosechaRaw}`
    : `${cosechaRaw.slice(0, 2)}/${cosechaRaw.slice(2)}`;
  console.log("::: Cosecha final:", cosecha);
  return cosecha;
}


module.exports = async (sock, from, text, userState) => {
  await sock.sendMessage(from, { text: "⏳"+mensajes.mensaje_aguarde});
  try {
    const jid = from;
    const numero = extraerNumero(jid);
    console.log('📥 Entrando a ficha romaneos pendientes');
    console.log('📦 Parámetros recibidos:', { from, text, userState });
    const validacion = await verificarUsuarioValido(numero, config.cliente);
    if (!validacion || !validacion.usuario) {
      await sock.sendMessage(from, { text: mensajes.numero_no_asociado });
      userStates.clearState(from); // Limpiar el estado del usuario
      return;
    }

    const usuario = validacion.usuario;
    const cuenta = usuario.cuenta;
    const coope = usuario.coope;

  
    const imagen = fs.readFileSync(config.clienteRobotImg);
    const partes = text.split(/\s+/); // Dividir el comando en partes
    if (partes.length < 4) {
      console.log('⚠️ Comando incompleto:', partes);
      await sock.sendMessage(from, {
        text: '⚠️ Comando incompleto.*',
      });
      return;
    }

    const cereal = partes[4];
    const clase = partes[2]; // Tercer elemento es la clase
    const cosechaRaw = partes[3]; // Cuarto elemento es la cosecha
    console.log('✅ Cereal:', { cereal });
    const coopesSinBarra = ["01", "09", "12", "15", "17", "20", "23", "29"];
    const coopeNorm = normalizarCoope(coope);
    const cosecha = coopesSinBarra.includes(coopeNorm)
      ? `${cosechaRaw}`
      : `${cosechaRaw.slice(0, 2)}/${cosechaRaw.slice(2)}`;
    console.log("::: Cosecha final:", cosecha);
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