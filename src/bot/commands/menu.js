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
  const numero = extraerNumero(from);
  const imagen = ""
 
  

  try {
    const validacion = await verificarUsuarioValido(numero);
    if (!validacion?.usuario) {
      await sock.sendMessage(from, { text: mensajesDefault.numero_no_asociado });
      return;
    }

    const [id] = validacion.usuario;
    const coope = parseInt(id, 10);
   
   const imagen = fs.readFileSync(config.clienteRobotImg); 
    const mensajesCliente = cargarMensajesCliente(coope);
    const response = mensajesCliente.menu;

    await sock.sendMessage(from, { image: imagen, caption: response });

  } catch (error) {
    console.error('Error al procesar mensaje:', error);
    await sock.sendMessage(from, { text: mensajesDefault.error_solicitud });
  }
};
