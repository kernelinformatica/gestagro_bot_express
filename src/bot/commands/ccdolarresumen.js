import { config, clientesCodigo, api } from '../config.js';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';
import { extraerNumero } from '../utils.js';
import apiCliente from '../../services/apiCliente.js';
const { verificarUsuarioValido } = apiCliente;
import mensajesDefault from '../mensajes/default.js';



async function cargarMensajesCliente(coopeId) {
  const codigo = clientesCodigo[coopeId];
  if (!codigo) return mensajesDefault;
  const ruta = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    '..',
    'mensajes',
    `${codigo}.js`
  );
 
  return fs.existsSync(ruta) ? (await import(ruta)).default : mensajesDefault;
}

export default  async (sock, from, nroCuenta = "0") => {

  const mensajesCliente = await cargarMensajesCliente(parseInt(config.cliente, 10));
  await sock.sendMessage(from, { text: `⏳ ${mensajesCliente.mensaje_aguarde}` });

  try {
    const jid = from
    const numero = extraerNumero(jid);
    const logo = fs.readFileSync(config.clienteLogo);
    const imagen = fs.readFileSync(config.clienteRobotImg);
    const validacion = await verificarUsuarioValido(numero, config.cliente);
    
    
    const usuario = validacion.usuario;
    const cuenta = usuario.cuenta;
    const coope = usuario.coope;
    const tipo = "resumen-ctacte-uss"; 
    
    if (!validacion || !validacion.usuario) {
      await sock.sendMessage(from, { text: mensajesCliente.numero_no_asociado });
      userStates.clearState(from); // Limpiar el estado del usuario
      return;
      }
    console.log(':: Generando resumen de cuenta en dólares :: '+api.URL_REPORTES_PDF);  
    // Llamada a la API para generar el PDF con parámetros
    const pdfResponse = await axios.post(api.URL_REPORTES_PDF, {
      coope: coope,
      cuenta: cuenta,
      tipo: tipo,
    }, {
      responseType: 'stream', // Asumimos que devuelve el archivo directamente
    });

    // Guardar temporalmente el PDF
    const tempPath = './pdfs/'+cuenta+'-ctacte-dolar-temp.pdf';
    const writer = fs.createWriteStream(tempPath);
    pdfResponse.data.pipe(writer);

    writer.on('finish', async () => {
      // Enviar el archivo como un mensaje adjunto
      const pdfBuffer = fs.readFileSync(tempPath); // Leer el archivo como buffer
      await sock.sendMessage(from, {
        document: pdfBuffer,
        mimetype: 'application/pdf',
        fileName: cuenta+'-resumen-de-cuenta-dolar.pdf',
      });


      if (config.mensajesConLogo == "S"){
        await sock.sendMessage(from, { text: mensajesCliente.menu_respuesta_descarga });
        //await sock.sendMessage(from, { image: imagen, document,caption: mensajesCliente.menu_respuesta_descarga  });
      }  else{
        await sock.sendMessage(from, { text: mensajesCliente.menu_respuesta_descarga });
      }

     

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