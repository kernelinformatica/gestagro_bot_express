import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import ftp from 'basic-ftp';
import { downloadMediaMessage } from '@whiskeysockets/baileys';

// Obtener el directorio actual en un entorno ES6
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async (sock, from, text, msg, cuenta, coope) => {
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
        try {
            console.log('📍 Punto de control 1.5: Intentando descargar la imagen...');
            buffer = await downloadMediaMessage(msg, 'buffer', {}); // Especificar 'buffer' como formato de salida
            console.log('✅ El mercado de cereales se actualizó con éxito.');
        } catch (err) {
            console.error('❌ Error al descargar la imagen:', err);
            await sock.sendMessage(from, { text: '❌ Error al descargar la imagen. Por favor, inténtalo de nuevo. ' + err });
            return;
        }

        const localFilePath = path.join(__dirname, '..', '..', 'assets', 'temp', 'pizarra.jpg');
        console.log(`📍 Punto de control 2 : UploadFTP() -> ${localFilePath}`);

        // Guardar la imagen en el servidor local
        fs.writeFileSync(localFilePath, buffer);
        console.log(`✅ Imagen guardada temporalmente en: ${localFilePath}`);

        // Configuración del servidor FTP
        const ftpConfig = {
            host: "192.168.254.47",
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
            sock.sendMessage(from, { text: '❌ Error al subir el archivo al servidor FTP.' + err });
        } finally {
            client.close(); // Cerrar la conexión FTP
        }
    } catch (error) {
        console.error('❌ Error en el comando de subida FTP:', error);
        await sock.sendMessage(from, { text: '❌ Ocurrió un error al intentar subir el archivo.' + error });
    }
};