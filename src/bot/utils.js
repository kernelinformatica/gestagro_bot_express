const cerealesPorDescripcion = require('./maps/cereales'); // Ruta correcta
const dns = require('dns');
const url = require('url');
const axios = require('axios');


function generarIconosNumericos(hasta = 100) {
  const iconos = [];
  const emojiNumeros = ['0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'];

  for (let i = 1; i <= hasta; i++) {
    if (i <= 9) {
      // Para números del 1 al 9, usar los emojis directamente
      iconos.push(emojiNumeros[i]);
    } else {
      // Para números mayores a 9, usar el número en negrita
      iconos.push(`*${i}* -`); // Representar el número en negrita
    }
  }

  return iconos;
}
const formatterPrecios = new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
function normalizarEntrada(texto) {
    const emojiToNumero = {
      '1️⃣': '1', '2️⃣': '2', '3️⃣': '3', '4️⃣': '4', '5️⃣': '5',
      '6️⃣': '6', '7️⃣': '7', '8️⃣': '8', '9️⃣': '9', '🔟': '10'
    };
    return emojiToNumero[texto.trim()] || texto.trim();
}
  
function buscarCodigoCereal(nombreCereal) {
  console.log('Buscando código para el cereal:', nombreCereal);
  const nombreNormalizado = nombreCereal.toUpperCase(); // Convertir a mayúsculas para asegurar coincidencia
  return cerealesPorDescripcion[nombreNormalizado] || null; // Retornar el código o null si no se encuentra
}


function esNumeroWhatsApp(remitente) {
  return remitente.endsWith('@s.whatsapp.net');
}

function getCleanId(rawId) {
 
  if (!rawId || typeof rawId !== 'string') {
    console.warn('⚠️ JID inválido recibido:', rawId);
    return '';
  }

  if (rawId.includes('@lid')) {
    //console.log('|-------------------> Identificador LID detectado:', rawId);
    return rawId; // usar tal cual
  }

  if (rawId.includes('@s.whatsapp.net')) {
    //console.log('|-------------------> Identificador s.whatsapp.net detectado:', rawId);
    const numero = rawId.split('@')[0];
    return `${numero}@s.whatsapp.net`;
  }

  // Fallback defensivo para otros casos
  //console.log('|-------------------> Identificador desconocido, se devuelve tal cual:', rawId);
  return rawId;
}

function extraerNumero(jid) {
  const raw = jid.split('@')[0];
  const dominio = jid.split('@')[1];
 
  // Solo aplicar limpieza si el JID es de tipo s.whatsapp.net
  if (dominio === 's.whatsapp.net') {
    if (raw.startsWith('549')) {
   
      return raw.slice(3);
    }
    if (raw.startsWith('54')) {
      
      return raw.slice(2);
    }
  }

  // En otros casos (como @lid), devolver el número completo
 
  return raw;
}

async function descargarImagenRemota(imageUrl) {
  if (!imageUrl || typeof imageUrl !== 'string') {
    throw new Error('URL no válida o indefinida');
  }

  try {
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 5000
    });

    if (response.status !== 200) {
      throw new Error(`Respuesta inválida: ${response.status}`);
    }

    return Buffer.from(response.data, 'binary');
  } catch (error) {
    throw new Error(`No se pudo descargar la imagen: ${error.message}`);
  }
}



async function descargarImagenRemotaHttps(imageUrl) {
  const parsedUrl = url.parse(imageUrl);
  const hostname = parsedUrl.hostname;
  const path = parsedUrl.path;

  const agent = new https.Agent({
    lookup: (host, options, callback) => {
      dns.lookup(host, { family: 4 }, callback); // fuerza IPv4
    }
  });

  try {
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      httpsAgent: agent,
      timeout: 5000
    });

    if (response.status !== 200) {
      throw new Error(`Respuesta inválida: ${response.status}`);
    }

    return Buffer.from(response.data, 'binary');
  } catch (error) {
    console.warn(`[descargarImagenRemota] Error con HTTPS: ${error.message}`);

    // Fallback a HTTP si el host lo permite
    if (imageUrl.startsWith('https://')) {
      const fallbackUrl = imageUrl.replace('https://', 'http://');
      try {
        const fallbackResponse = await axios.get(fallbackUrl, {
          responseType: 'arraybuffer',
          timeout: 5000
        });

        if (fallbackResponse.status !== 200) {
          throw new Error(`Fallback HTTP fallido: ${fallbackResponse.status}`);
        }

        return Buffer.from(fallbackResponse.data, 'binary');
      } catch (fallbackError) {
        throw new Error(`No se pudo descargar la imagen por HTTP: ${fallbackError.message}`);
      }
    } else {
      throw new Error(`No se pudo descargar la imagen: ${error.message}`);
    }
  }
}


  
module.exports = { generarIconosNumericos,formatterPrecios, normalizarEntrada, buscarCodigoCereal , getCleanId, extraerNumero, descargarImagenRemota};

  