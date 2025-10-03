const { verificarUsuarioValido, obtenerDatosDeContacto } = require('../../services/apiCliente');
const mensajes = require('../../bot/mensajes/default')
const userStates = require('../userStates'); 
const { getCleanId, extraerNumero } = require('../utils');
const { config } = require('../config');
const fs = require('fs');
module.exports = async (sock, from, nroCuenta= "0") => {

  await sock.sendMessage(from, { text: "⏳"+mensajes.mensaje_aguarde });
  try {
    const jid = from
    const numero = extraerNumero(jid);
    console.log('Ejecutando comando contacto para el cliente:', numero, config.cliente);
    // Verificar si el usuario es válido
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
    
    if (!validacion || !validacion.usuario) {
      await sock.sendMessage(from, { text: mensajes.numero_no_asociado });
      return;
    } 
 
    const respuesta = await obtenerDatosDeContacto(numero,  cuenta);
    


    const textoOriginal = respuesta.contacto; // viene desde tu backend
    const textoFormateado = formatearNumerosComoClickeables(textoOriginal);

    



   if (config.mensajesConLogo == "S"){
      await sock.sendMessage(from, { image: imagen, caption: textoFormateado  });
    }  else{
       //await sock.sendMessage(from, { image: imagen, caption: contacto   });
       await sock.sendMessage(from, { image: imagen, caption: textoFormateado  });
    }


    


   
  } catch(error) {
    console.error('🛑 Error en comando contacto:', error);
    await sock.sendMessage(from, { text: mensajes.error_general });
  }
};

function formatearNumerosComoClickeables(texto) {
  return texto.replace(/(\d{10})/g, (numero) => {
    const formateado = `+54 ${numero.slice(0, 3)} ${numero.slice(3, 6)} ${numero.slice(6)}`;
    return formateado;
  });
}



