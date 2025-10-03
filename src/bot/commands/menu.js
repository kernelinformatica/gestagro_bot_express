const { config, clientesCodigo } = require('../config');
const fs = require('fs');
const path = require('path');
const { extraerNumero } = require('../utils');
const { verificarUsuarioValido } = require('../../services/apiCliente');
const mensajesDefault = require('../mensajes/default');

function cargarMensajesCliente(coopeId) {
  const codigo = clientesCodigo[coopeId];
  if (!codigo) return mensajesDefault;
  const ruta = path.join(__dirname, '..', 'mensajes', `${codigo}.js`);
  return fs.existsSync(ruta) ? require(ruta) : mensajesDefault;
}

module.exports = async (sock, from, text, msg) => {
  await sock.sendMessage(from, { text: "⏳ Procesando su solicitud..." });
  const jid = from
  const numero = extraerNumero(jid);
  const cuenta = "0"
  const logo = fs.readFileSync(config.clienteLogo);
  const imagen = fs.readFileSync(config.clienteRobotImg);
  
  try {
    const validacion = await verificarUsuarioValido(numero, config.cliente);
    if (!validacion?.usuario) {
      await sock.sendMessage(from, { text: mensajesDefault.numero_no_asociado });
      return;
    }

   const [id] = validacion.usuario.coope;
   const nombre = validacion.usuario.nombre;
   const coopeCli = parseInt(id, 10);
   const imagen = fs.readFileSync(config.clienteRobotImg); 
   const mensajesCliente = cargarMensajesCliente(validacion.usuario["coope"]);
   const response = mensajesCliente.menu;
   if (config.mensajesConLogo == "S"){
    await sock.sendMessage(from, { image: imagen, caption: "👋 Hola "+nombre + "\n\n"+response  });
  }  else{
    await sock.sendMessage(from, { text: response});
  }


   

  } catch (error) {
    console.error('Error al procesar mensaje:', error);
    await sock.sendMessage(from, { text: mensajesDefault.error_solicitud +" | "+error});
  }
};
