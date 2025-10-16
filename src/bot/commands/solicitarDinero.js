import { config, clientesCodigo } from '../config.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { extraerNumero } from '../utils.js';
import apiCliente from '../../services/apiCliente.js';
const { verificarUsuarioValido } = apiCliente;
import mensajesDefault from '../mensajes/default.js';

async function cargarMensajesCliente(coopeId) {
  const codigo = clientesCodigo[coopeId];
  if (!codigo) return mensajesDefault;
  const ruta = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    '..',
    'mensajes',
    `${codigo}.js`
  );

  return fs.existsSync(ruta) ? (await import(ruta)).default : mensajesDefault;
}

export default async (sock, from, nroCuenta = "0", userState) => {
  const mensajesCliente = await cargarMensajesCliente(parseInt(config.cliente, 10));
  try {
    const jid = from;
    const numero = extraerNumero(jid);

    // Verificar si el usuario es válido
    const validacion = await verificarUsuarioValido(numero, config.cliente);
    if (!validacion || !validacion.usuario) {
      await sock.sendMessage(from, { text: mensajesCliente.numero_no_asociado });
      return;
    }

    // Flujo de preguntas basado en estados
    if (!userState.estado) {
      // Preguntar el tipo de transferencia
      userState.estado = 'preguntar_tipo_transferencia';

      if (config.mensajesConLogo === 'S') {
        await sock.sendMessage(from, { image: { url: config.clienteRobotImg }, caption: '¿Qué tipo de operacioón desea realizar?\n1️⃣ Transferencia\n2️⃣ Cheque\n3️⃣ Cheque electronico\n4️⃣ Otro..',});
      } else {
        await sock.sendMessage(from, { text: '\n¿Qué tipo de operación desea realizar?\n1️⃣ Transferencia\n2️⃣ Cheque\n3️⃣ Cheque electronico\n4️⃣ Otro..', });
      }



   
      return;
    }

    if (userState.estado === 'preguntar_tipo_transferencia') {
      // Guardar el tipo de transferencia seleccionado
      const seleccion = parseInt(nroCuenta, 10);
      if (isNaN(seleccion) || seleccion < 1 || seleccion > 3) {

        if (config.mensajesConLogo === 'S') {
          await sock.sendMessage(from, { image: { url: config.clienteRobotImg }, caption: 'Por favor, seleccione una opción válida (1️⃣,2️⃣ o 3️⃣).' });
        } else {
          await sock.sendMessage(from, { text: 'Por favor, seleccione una opción válida (1️⃣,2️⃣ , 3️⃣, 4️⃣).' });
        }

       
        return;
      }

      const tiposTransferencia = ['Transferencia', 'Cheque', 'Cheque Electronico', 'Otro..'];
      userState.tipoTransferencia = tiposTransferencia[seleccion - 1];
      userState.estado = 'preguntar_cantidad_dinero';

      await sock.sendMessage(from, { text: `Ha seleccionado: ${userState.tipoTransferencia}.` });
      await sock.sendMessage(from, { text: '¿Qué cantidad de dinero desea solicitar?' });
      return;
    }

    if (userState.estado === 'preguntar_cantidad_dinero') {
      // Guardar la cantidad de dinero
      const cantidad = parseFloat(nroCuenta);
      if (isNaN(cantidad) || cantidad <= 0) {
        await sock.sendMessage(from, { text: 'Por favor, ingrese una cantidad válida.' });
        return;
      }

      userState.cantidadDinero = cantidad;
      userState.estado = null; // Finalizar el flujo

      await sock.sendMessage(from, {
        text: `Solicitud completada:\n- Tipo de transferencia: ${userState.tipoTransferencia}\n- Cantidad: ${userState.cantidadDinero}`,
      });

      // Aquí puedes continuar con el proceso, como guardar en la base de datos o llamar a otra función
      return;
    }
  } catch (error) {
    console.error('🛑 Error en solicitarDinero:', error);
    await sock.sendMessage(from, { text: mensajesDefault.error_obtencion_saldos });
  }
};