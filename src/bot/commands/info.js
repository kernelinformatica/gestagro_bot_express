const mensajes = require('../mensajes/default');
const mensajesAcevedo = require('../mensajes/01');
const mensajesCaur = require('../mensajes/03');
const mensajesCoopaz = require('../mensajes/05');
const mensajesMarga= require('../mensajes/06');
const mensajesCoopar= require('../mensajes/11');
const mensajesGodoy= require('../mensajes/12');
const mensajesCrespo= require('../mensajes/29');
const fs = require('fs');
const { getCleanId, extraerNumero } = require('../utils');
const { m, verificarUsuarioValido } = require('../../services/apiCliente');
const { config } = require('../config');
module.exports = async (sock, from, text, msg) => {

  try {
    console.log('📥 Entrando a comando info');
    const jid = from
    const numero = extraerNumero(jid);
    // Verificar si el usuario es válido
    const validacion = await verificarUsuarioValido(numero);
    const usuario = validacion['usuario'];
    const [id, cta, nombre] = usuario;
    const nombreSocio = usuario[3].split(' ').slice(1).join(' ');
    const coope = parseInt(id, 10);
    const cuerpo_1 = "🤖 HOLA"
    const imagen = fs.readFileSync(config.clienteRobotImg);
    
    if (!validacion || !validacion.usuario) {

      await sock.sendMessage(getCleanId(from), { text: mensajes.numero_no_asociado });
      return;
    }


    



    if (coope === 1) {
      resp =  mensajesAcevedo.gestagro
     
    } else if (coope === 3) {
      // menu para caur
      resp =  mensajesCaur.gestagro
      
    } else if (coope === 5) {
      // menu para coopaz
      resp = mensajesCoopaz.gestagro
      
    } else if (coope === 6) {
      // menu para margarita
      resp = mensajesMarga.gestagro
    
    } else if (coope === 11) {
      resp =  mensajesCoopar.gestagro
    } else if (coope === 12) {
      resp =  mensajesGodoy.gestagro
    } else if (coope === 29) {
      // menu para gcrespo
      resp =   mensajesCrespo.gestagro
      
    } else {
      // menu para gestagro * para todos los demas clientes
      resp =  mensajes.gestagro
     
    }
  
    
 
    if (config.mensajesConLogo == "S"){
     
      await sock.sendMessage(from, { image: imagen, caption: `${resp}`  });
    }  else{
      await sock.sendMessage(from, { image: imagen, caption: `${resp}`  });
      
      
    }


  } catch (error) {
    await sock.sendMessage(getCleanId(from), { text: mensajes.error_general });
  }




};