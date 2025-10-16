
import { config, clientesCodigo, ftpUpload } from '../config.js';
import fs from 'fs';
import ftp from 'basic-ftp';
import path from 'path';
import { fileURLToPath } from 'url';
import { extraerNumero } from '../utils.js';
import apiCliente from '../../services/apiCliente.js';
const { verificarUsuarioValido } = apiCliente;
import mensajesDefault from '../mensajes/default.js';
import { downloadMediaMessage } from '@whiskeysockets/baileys';
const cuentasPermitidas = ["0520781", "0530059", "0530900","0530028", "0510282"];
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
export default async (sock, from, text, msg, cuenta, coope) => {
    const mensajesCliente = await cargarMensajesCliente(parseInt(config.cliente, 10));
        await sock.sendMessage(from, { text: `⏳ ${mensajesCliente.mensaje_aguarde}` });
    // Repositorio de cuentas permitidas
    console.log('📥 Entrando a comando subirmercado FTP) ');
    //
    if (!cuentasPermitidas.includes(cuenta)) {
        console.log(`⚠️ Cuenta no permitida: ${cuenta}`);
        await sock.sendMessage(from, { text: '❌ No tienes permiso para publicar el mercado de cereales.' });
        return;
    }
    sock.sendMessage(from, { text: '📤 Subiendo mercado de cereales...' });
   

    try {
        console.log('📤 Iniciando subida FTP...');
        console.log('📍 Punto de control 0: Estructura del mensaje:', msg.message);

        // Verificar si el mensaje contiene una imagen
        if (!msg.message || !msg.message.imageMessage) {
            console.log('⚠️ El mensaje no contiene una imagen válida.');
            await sock.sendMessage(from, { text: '❌ Por favor, envía una imagen para subir al servidor.' });
            return;
        }

        console.log(`📍 Punto de control 1 : UploadFTP() -> Mensaje válido con imagen.`);

        // Descargar la imagen enviada por el usuario
        let buffer;
        console.log('📍 Punto de control 1.2: Contenido de imageMessage:', msg);
        try {
            console.log('📍 Punto de control 1.5: Intentando descargar la imagen...');
            buffer = await downloadMediaMessage(msg, 'buffer', {}); // Especificar 'buffer' como formato de salida
            console.log('✅ El mercado de cereales se actualizo con éxito.');
        } catch (err) {
            console.error('❌ Error al descargar la imagen:', err);
            await sock.sendMessage(from, { text: '❌ Error al descargar la imagen. Por favor, inténtalo de nuevo. ' +err});
            return;
        }


        const localFilePath = path.join(__dirname, '..', '..', 'assets', 'temp', 'pizarra.jpg');
        console.log(`📍 Punto de control 2 : UploadFTP() -> ${localFilePath}`);

        // Guardar la imagen en el servidor local
        fs.writeFileSync(localFilePath, buffer);
        console.log(`✅ Imagen guardada temporalmente en: ${localFilePath}`);

        // Configuración del servidor FTP
       
        //host : "192.168.254.47",
        //user: "maximopazupload",
        //password: "zRnSUzrNqDO8A9Nv",
        const ftpConfig = {
           host : "192.168.254.47",
            user: "maximopazupload",
            password: "zRnSUzrNqDO8A9Nv",
        };

        // Ruta remota en el servidor FTP
        const remoteFilePath = `/imagenes/pizarra.jpg`;

        // Conexión FTP
        const client = new ftp.Client();
        client.ftp.verbose = true;

        try {
            await client.access(ftpConfig);
            console.log('✅ Conexión FTP establecida.');

            // Subir el archivo al servidor FTP
            await client.uploadFrom(localFilePath, remoteFilePath);
            console.log(`✅ Archivo subido correctamente a ${remoteFilePath}`);
            sock.sendMessage(from, { text: '✅ Archivo subido correctamente al servidor FTP.' });

            // Eliminar el archivo temporal después de subirlo
            fs.unlinkSync(localFilePath);
        } catch (err) {
            console.error('❌ Error al subir el archivo:', err);
            sock.sendMessage(from, { text: '❌ Error al subir el archivo al servidor FTP.'+err });
        } finally {
            client.close(); // Cerrar la conexión FTP
        }
    } catch (error) {
        console.error('❌ Error en el comando de subida FTP:', error);
        await sock.sendMessage(from, { text: '❌ Ocurrió un error al intentar subir el archivo.'+error });
    }
};