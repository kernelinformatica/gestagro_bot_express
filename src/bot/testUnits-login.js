const axios = require('axios');

const fetch = require('node-fetch'); // Asegúrate de tener node-fetch instalado
const API_URL = "http://192.168.254.15:6012"; // Reemplaza con la URL de tu API

async function testRegistrarUsuario(numero, numeroInterno, cuenta, coope) {
  console.log("Registrando usuario con número:", numero, "numero interno: ", numeroInterno,", cuenta:", cuenta, "y coope: ", coope);
  if (numero.length > 10 && numeroInterno > 10){
    numero = 0
  }
  try {
    numero_interno = numeroInterno
    const res = await fetch(`${API_URL}/api/auth/registrar-usuario`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ numero, numero_interno, cuenta, coope }),
    });
    const data = await res.json();
    console.log('Usuario registrado:', data);
    return data;
  } catch (error) {
    console.error('Error al registrar el usuario:', error);
    throw error;
  }
}

async function testValidarCuenta() {
    const cuenta = "1100230";
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


async function testLogin() {
    const cuenta = "1100105";
    const clave = "1234";

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



const obtenerDatosDeContacto = async (celu, nroCuenta = "0", coope) => {
  try {
    const res = await fetch(`${API_URL}/api/chat/obtener-datos-contacto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ celular: celu, cuenta: nroCuenta, coope:coope }),
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


const descargarFicha = async (celu) => {
 


  
  const cuenta ="1100028"
  const coope = "11";

  // Dividir el comando en partes
  

  const cereal ="23"
  const clase = "000"
  const cosecha = "24/25";
  const cerealCodigo = "23";


  console.log(
    `:: Ficha de cereales parámetros para enviar -> cereal: ${cereal}, clase: ${clase}, cosecha: ${cosecha}, cuenta: ${cuenta}`
  );
  
  // Llamada a la API para generar el PDF

  const pdfResponse = await axios.post(
    "https://dev.kernelinformatica.com.ar/reportes/generarReportePdf",
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

    await sock.sendMessage(from, { text: "xxx" });

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

}
const verificarUsuarioValido = async (celu, coope) => {
  try {
    console.log(":::: Verificando usuario con coope:", celu, coope);
    const res = await fetch(`${API_URL}/api/chat/verificar-usuario`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ celular: celu, coope: coope }),
    });

    console.log("📡 Estado de respuesta:", res.status);

    const data = await res.json();
    console.log("📦 Respuesta de la API:", data);

    if (!data || !data.usuario) {
      throw new Error("La respuesta de la API no contiene el campo 'usuario'.");
    }

    return data.usuario; // Devuelve solo el objeto 'usuario'
  } catch (error) {
    console.error('🛑 Error al verificar usuario:', error.message);
    throw error;
  }
};







// Ejecutar la prueba
(async () => {
  try {
    const resu = await descargarFicha("3416435556");
    console.log(resu); // Aquí se imprime el resultado resuelto
  } catch (error) {
    console.error("Error  descargarFicha :", error);
  }
})();