const cerealesPorDescripcion = require('./maps/cereales'); // Ruta correcta

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
  return  rawId
  /*if (rawId.includes('@lid')) {
    console.log('|-------------------> Identificador LID detectado:', rawId);
    return rawId; // usar tal cual
  } else if (rawId.includes('@s.whatsapp.net')) {
    console.log('|-------------------> Identificador WhatsApp detectado:', rawId);
    return rawId; // usar tal cual
  } else {
    // fallback defensivo
    console.log('-------------------> Otro Identificador detectado:', rawId);
    return rawId.split(':')[0];
  }*/
}
function extraerNumero(jid) {
  const raw = jid.split('@')[0];
  if (jid.includes('@s.whatsapp.net')) {
    return raw.slice(3); // quita el 549
  } else if (jid.includes('@lid')) {
    return raw; // usar tal cual
  } else {
    return raw; // fallback defensivo
  }
}
  
module.exports = { generarIconosNumericos,formatterPrecios, normalizarEntrada, buscarCodigoCereal };

  