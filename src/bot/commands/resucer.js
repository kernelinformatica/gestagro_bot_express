const { obtenerResumenDeCereales, verificarUsuarioValido } = require('../../services/apiCliente');
const { generarIconosNumericos } = require('./../utils');
const userStates = require('../userStates'); // Importar el manejo de estados
const mensajes = require("../mensajes/default");
const { getCleanId, extraerNumero } = require('../utils');
const iconosNumericos = generarIconosNumericos(50);
const { config } = require('../config');
const fs = require('fs'); 

module.exports = async (sock, from, nroCuenta, text) => {
  console.log(":: Resumen de cereales ::");
  await sock.sendMessage(from, { text: "⏳" + mensajes.mensaje_aguarde });
  try {
    const jid = from;
    const numero = extraerNumero(jid);
    const imagen = fs.readFileSync(config.clienteRobotImg);

    // Verificar si el usuario es válido
    const validacion = await verificarUsuarioValido(numero, config.cliente);
    if (!validacion || !validacion.usuario) {
      await sock.sendMessage(from, { text: mensajes.numero_no_asociado });
      userStates.clearState(from); // Limpiar el estado del usuario
      return;
    }

    // Obtener el resumen de cereales
    const resu = await obtenerResumenDeCereales(numero);
    console.log("Resumen obtenido:", resu);

    let resumenObj;

    // Validar y convertir el mensaje de la API
    if (typeof resu.message === 'string') {
      try {
        const jsonString = resu.message.replace(/'/g, '"'); // Reemplazar comillas simples por dobles
        resumenObj = JSON.parse(jsonString);
      } catch (error) {
        console.error("🛑 Error al convertir el mensaje de la API a JSON:", error);
        await sock.sendMessage(from, { text: mensajes.error_solicitud });
        userStates.clearState(from); // Limpiar el estado del usuario
        return;
      }
    } else {
      resumenObj = resu.message; // Ya era objeto
    }

    // Validar que el resumen tenga los datos necesarios
    if (!resumenObj || !resumenObj.resumen || !Array.isArray(resumenObj.resumen)) {
      console.error("Datos de resumen inválidos:", resumenObj);
      await sock.sendMessage(from, { text: mensajes.error_solicitud });
      userStates.clearState(from); // Limpiar el estado del usuario
      return;
    }

    let nombreSocio = resumenObj.nombre;
    let nombreEmpresa = resumenObj.empresa;
    const opcionesFicha = {};
    const opcionesRomaneos = {};
    const sep = "\n\n";
    let mensaje = `🤖 *Resumen de cereales*\n`;
    mensaje += `${nombreSocio}\n` + sep;

    resumenObj.resumen.forEach((item, index) => {
      console.log(`Procesando registro ${index + 1}:`, item);

      // Validar que los campos necesarios existan
      if (!item.cereal || !item.clase_codigo || !item.cosecha) {
        console.warn(`⚠️ Registro inválido en índice ${index}:`, item);
        return;
      }

      const claseFormateada = parseInt(item.clase_codigo, 10);
      const cerealCodigo = parseInt(item.cereal_codigo, 10);
      const cosechaFormateada = item.cosecha.replace('/', '');
      const cerealCorto = item.cereal.substring(0, 10);
      const numeroClave = `${index + 1}`;
      const numeroIcono = iconosNumericos[index] || `*${numeroClave}.*`;

      opcionesFicha[`F${numeroClave}`] = {
        cereal: item.cereal,
        cereal_codigo : cerealCodigo,
        clase: claseFormateada,
        cosecha: cosechaFormateada,
      };

      opcionesRomaneos[`R${numeroClave}`] = {
        cereal: item.cereal,
        cereal_codigo : cerealCodigo,
        clase: claseFormateada,
        cosecha: cosechaFormateada,
      };

      mensaje +=
        `${numeroIcono} ${cerealCorto} (${item.cosecha})\n` +
        `✔️ Cereal Cod: ${item.cereal_codigo}\n` +
        `✔️ Clase: ${item.clase}\n` +
        `✔️ Saldo: ${item.saldo.toLocaleString()} Kg\n\n`;
    });

    mensaje += `*INSTRUCCIONES DE DESCARGA*\n\n` +
      `📥 Cereales: escribí: *F+número (ej: F1, F2, etc...)*\n` +
      `📥 Romaneos: escribí: *R+número (ej: R1, R2, etc...)*\n` +
      sep;
    mensaje += "(S.E.U.O.)\n";
    mensaje += nombreEmpresa;

    // Guardar el estado del usuario
    userStates.setState(from, {
      estado: 'resumen_cereales',
      opcionesFicha,
      opcionesRomaneos,
    });

    if (config.mensajesConLogo == "S") {
      console.log("Enviando mensaje con robot -> ", mensaje);
      await sock.sendMessage(from, { image: imagen, caption: mensaje });
    } else {
      await sock.sendMessage(from, { text: mensaje });
    }

  } catch (error) {
    console.error("🛑 Error completo:", error);
    await sock.sendMessage(from, { text: mensajes.error_solicitud });
    userStates.clearState(from); // Limpiar el estado del usuario en caso de error
  }
};