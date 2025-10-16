import fetch from 'node-fetch';
import axios from 'axios';
import * as cheerio from 'cheerio';
import userStates from '../bot/userStates.js';
import { api, info } from '../bot/config.js';
const API_URL = api.API_URL;
const URL_BNA = api.URL_BNA;
console.log("===============> Url GestagroRest --> "+ `${API_URL} <===============`);
console.log("===============> Url Banco Nacion --> "+ `${URL_BNA} <===============`);
console.log(`===============> 📞 Soporte: ${info.telefonoSoporte} | 📧 ${info.emailSoporte} <===============`);

export const postRequest = async (endpoint, body) => {
  const res = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return await res.json();
};

export const obtenerCotizacionesBna = async (celu, mon, nroCuenta = "0") => {
  try {
    const url = URL_BNA;
    const { data: html } = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    const $ = cheerio.load(html);
    console.log(html);
    const limpiarNumero = (texto) =>
      parseFloat(texto.replace(/\./g, "").replace(",", "."));

    let respuestaFinal = `⚠️ No se encontraron  cotizaciónes, intente más tarde.`;

    $("table tbody tr").each((_, row) => {
      const cols = $(row).find("td");
      if (cols.length >= 3) {
        const moneda = cols.eq(0).text().trim();
        const compra = limpiarNumero(cols.eq(1).text().trim());
        const venta = limpiarNumero(cols.eq(2).text().trim());

        if (moneda.toLowerCase().includes(mon.toLowerCase())) {
          const spread = venta - compra;
          const emoji = spread > 10 ? "📈" : "⚖️";
          respuestaFinal = `${emoji} Cotización ${moneda}:\n💰 Compra: $${compra.toFixed(2)}\n💸 Venta: $${venta.toFixed(2)}\n📊 Spread: $${spread.toFixed(2)}`;
        }
      }
    });

    return { celular: celu, moneda: mon, cuenta: nroCuenta, mensaje: respuestaFinal };

  } catch (error) {
    console.error("Error al obtener cotización BNA:", error.message);
    return {
      celular: celu,
      moneda: mon,
      cuenta: nroCuenta,
      mensaje: "❌ No se pudo acceder a la cotización del BNA. Intentá más tarde.",
    };
  }
};

export const obtenerSaldo = async (celu, mon,nroCuenta) => {

  const res = await fetch(`${API_URL}/api/chat/saldo`, {

    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ celular: celu, moneda: mon, cuenta: nroCuenta }),
  });
  
  return await res.json();
};

const obtenerEmpresa = async (celu, codigo = 0) => {
  const res = await fetch(`${API_URL}/api/chat/get-empresa`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ celular: celu, coope: codigo }),
  });
  return await res.json();
};

const obtenerEmpresasAsociadas = async (celu, codigo = 0) => {
  const res = await fetch(`${API_URL}/api/chat/get-empresas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ celular: celu, coope: 0 }),
  });
  return await res.json();
};

export const obtenerResumenDeCereales = async (celu) => {
  const res = await fetch(`${API_URL}/api/chat/resumen-cereales`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ celular: celu }),
  });
  return await res.json();
};

export const obtenerFichaDeCereales = async (celu, cereal, cosecha, clase = "0") => {
  const res = await fetch(`${API_URL}/api/chat/ficha-cereales`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ celular: celu, cereal: cereal, clase: clase, cosecha: cosecha }),
  });
  //console.log("Respuesta de obtenerFichaDeCereales:", res.status, await res.text()); // Para depurar
  return await res.json();
};


export const obtenerMercadoCereales = async (celu, tipo) => {
  const res = await fetch(`${API_URL}/api/chat/mercado-cereales`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ celular: celu, tipo: tipo }),
  });
  return await res.json();
};

export const verificarUsuarioValido = async (celu, coope = "0") => {
  try {
    console.log(":::: Verificando usuario con coope:", celu, coope);
    const res = await fetch(`${API_URL}/api/chat/verificar-usuario`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ celular: celu, coope: coope }),
    });
    const data = await res.json();
    //console.log("📡 Estado de respuesta:", res.status);
    //console.log("📦 Respuesta de la API:", data);
    if (data.code !== 'OK' || data.status !== 200) {
      console.warn('⚠️ verificarUsuarioValido(): Usuario no válido o error en la API:', data);
      
    }
    
    return data; // Devuelve solo el objeto 'usuario'
  } catch (error) {
    console.error('🛑 Error al verificar usuario:', error.message);
    throw error;
  }
};







export const obtenerDatosDeContacto = async (celu, nroCuenta = "0") => {
  try {
    const res = await fetch(`${API_URL}/api/chat/obtener-datos-contacto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ celular: celu, cuenta: nroCuenta }),
    });

    console.log("📡 Estado de respuesta:", res.status);

    const contentType = res.headers.get('content-type');
    let data;

    if (contentType && contentType.includes('application/json')) {
      data = await res.json();
    } else {
      const text = await res.text();
      console.warn("⚠️ Respuesta no es JSON:", text);
      throw new Error(`Respuesta inesperada: ${text}`);
    }

    console.log("📦 JSON recibido:", data);
    return data;

  } catch (error) {
    console.error("🛑 Error en obtenerDatosDeContacto:", error.message);
    throw error;
  }
};

export const verificarUsuarioValidoPorEmpresa = async (celu, sock, from, comandoPendiente) => {
  const res = await fetch(`${API_URL}/api/chat/verificar-usuarios`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ celular: celu }),
  });

  const data = await res.json(); // Consumir el cuerpo de la respuesta

  if (!data.usuarios || data.usuarios.length === 0) {
    await sock.sendMessage(from, { text: '⚠️ No se encontraron empresas asociadas a este número.' });
    return null;
  }


  // Extraer las empresas de los usuarios, incluyendo la cuenta
  const empresas = data.usuarios.map((usuario) => ({
    ...usuario.empresa, // Copiar las propiedades de la empresa
    cuenta: usuario.usuario[1], // Agregar la cuenta desde el usuario
  }));

  if (empresas.length > 1) {
    // Si hay más de una empresa asociada, enviar un menú de opciones
    let mensaje = '🤖 Su teléfono está registrado en varias empresas. Seleccione una opción:\n\n';
    empresas.forEach((empresa, index) => {
      mensaje += `${index + 1}️⃣ ${empresa.nombre}\n`;
    });

    mensaje += '\nPor favor, responda con el número correspondiente.';

    // Enviar el mensaje al usuario
    await sock.sendMessage(from, { text: mensaje });

    // Guardar las empresas y el comando pendiente en el estado del usuario
    userStates.setState(from, {
      estado: 'seleccion_empresa',
      empresas,
      comandoPendiente, // Guardar el comando pendiente
    });

    return null; // Indicar que se necesita una selección del usuario
  }

  // Si solo hay una empresa asociada, devolverla directamente
  return empresas[0];
};

export async function loginEsperarRespuestaUsuario(sock, from) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      sock.ev.off('messages.upsert', listener);
      reject(new Error('Tiempo de espera agotado para la respuesta del usuario.'));
    }, 60000); // 60 segundos de espera

    const listener = async ({ messages }) => {
      const msg = messages[0];
      if (msg.key.remoteJid === from && msg.message?.conversation) {
        clearTimeout(timeout);
        sock.ev.off('messages.upsert', listener); // Desactivar el listener
        resolve(msg.message.conversation.trim());
      }
    };

    sock.ev.on('messages.upsert', listener);
  });
}


export const loginDesconectar = async (celu, cuenta= "0") => {
  try {
    console.log(":::: Desonectando usuario:", celu, cuenta);
    
    const res = await fetch(`${API_URL}/api/auth/desvincular-usuario`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ celular: celu, cuenta: cuenta }),
    });

    //console.log("📡 Estado de respuesta:", res.status);

    const data = await res.json();
    return data.message;
    //console.log("📦 Respuesta de la API SALIR:", data);
    
     
    
    return data; // Devuelve solo el objeto 'usuario'
  } catch (error) {
    console.error('🛑 Error al verificar usuario:', error.message);
    throw error;
  }
};






export async function loginValidarCuenta(cuenta) {
  try {
    const res = await fetch(`${API_URL}/api/auth/validar-cuenta`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cuenta }),
    });
    const data = await res.json();
    
    if (data.code = "OK" && data.status === 200){ 
      return true
    }else{  
      return false 
    }

  
  } catch (error) {
    console.error('Error al valida la cuenta: '+cuenta, error);
    return false;
  }
}


export  async function login(cuenta, clave) {
  console.log("Intentando login con cuenta:", cuenta, clave);  
  try {
    const res = await fetch(`${API_URL}/api/auth/login-bot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cuenta, clave }),
    });
    const data = await res.json();
    if (data.code === 'OK' && data.status === 200) {
      return true;
  } else {
      return false;
  }
    return data; 
  } catch (error) {
    console.error('Error al validar el usuario: '+cuenta, error);
    return false;
  }
}


export async function loginRegistrarUsuario(numero, numeroInterno, cuenta, coope) {
  console.log("Registrando usuario con número:", numero, "numero interno: ", numeroInterno,", cuenta:", cuenta, "y coope: ", coope);
  if (numero.length > 10 && numeroInterno > 10){
    numero = 0
    
  }

  try {
   
    
    const res = await fetch(`${API_URL}/api/auth/registrar-usuario`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ numero, numeroInterno , cuenta, coope }),
    });
   
    const data = await res.json();
    
    return data;
  } catch (error) {
    console.error('Error al registrar el usuario:', );
    throw error;
  }
}



export default  {
  obtenerSaldo,
  obtenerEmpresa,
  obtenerEmpresasAsociadas,
  obtenerResumenDeCereales,
  obtenerFichaDeCereales,
  obtenerMercadoCereales,
  verificarUsuarioValido,
  verificarUsuarioValidoPorEmpresa,
  obtenerCotizacionesBna,
  obtenerDatosDeContacto,
  loginValidarCuenta,
  login,
  loginRegistrarUsuario,
  loginEsperarRespuestaUsuario,
  loginDesconectar,
};