const obj = require('../config').coope;
const coope = obj["06"] || obj['default'];
const info = require('../config').info;
const mensajes = {
    
    gestagro : '🤖 👋 Hola soy el asistente virtual de '+coope.nombreBot+', te cuento quién soy:*\n\nSoy un sistema pensado y diseñado para el sector agropecuario, más específicamente para Cooperativas Agrícolas y Acopio de Granos.\n\nEscribi *menu* o *ayuda* para conocer los comandos que tengo disponibles.',
    numero_no_asociado : '🤖 *👋 Hola soy el asistente virtual de '+coope.nombreBot+'.\n\n\🚫 Su celular no esta asociado a la cooperativa con la que intenta interactuar.\n\nComuniquese con su cooperativa asociada para habilitar su número.\n\nHasta pronto !! 👋' ,
    menu: '🤖 👋 Hola soy el asistente virtual de '+coope.nombreBot+'.\n¿En qué puedo ayudarte hoy?\n\n1️⃣ Te cuento quién soy\n2️⃣ 💰 Saldo de su cuenta en pesos\n3️⃣️ 💰 Saldo de su cuenta en dolares  (si es que posee) \n4️⃣ Resumen de cereales. \n5️⃣ *pizarra* Mercado de cereales. \n6️⃣ Mercado cambiario Banco Nacion.', 
    menu_cuenta : '🤖 Menú Cuenta:\n1. *cambiarclave* → Cambiar clave de acceso a plataforma web.\n2. *cambiarmail* → Cambiar email registrado en plataforma web. \n',
    menu_resumen_ctacte_pesos :'🤖 Si desea descargar el resumen en pesos en formato pdf, escribí "resumen" o ingresa el número "10"\n', 
    menu_resumen_ctacte_dolar :'🤖 Si desea descargar el resumen en dólares en formato pdf, escribí "resumendolar" o ingresa el número "11"\n', 
    menu_detalle_ficha_cereal :'🤖 Si desea descargar la ficha de cereal en formato pdf, escribí "fice" o ingresa el número "5"\n',
    menu_respuesta_descarga :'✅ ¡Lo pedís acá lo tenés! ☝️ Acá te envío la informacíon que me solicitaste.\n\n_Escribí "*menu*" para volver al menú principal_',
    error_solicitud : '😢 No se pudo procesar tu solicitud en este momento, intenta nuevamente más tarde.',
    mercado_cereales_futuros_sin_datos: '😢 No hay datos publicados para el mercado de cereales en este momento.\n\n\Inténtelo nuevamente más tarde.',
    mercado_cereales_disponible_sin_datos: '😢 No hay datos publicados para el mercado de disponible en este momento.\n\n\Inténtelo nuevamente más tarde.',
    error_comando :'⚠️ Comando no reconocido. Hasta pronto !! 👋',
    error_comando_proceso : '😢 Error al procesar el comando solicitado:',
    error_obtencion_saldos : '😢 No se pudo obtener el saldo requerido en este momento, inténte nuevamente más tarde.\n\nEscribi *ayuda* para conocer los comandos que tengo disponibles.', 
    error_obtencion_resumen_ctacte : '😢 No se pudo obtener el resumen completo de su cuenta en pesos.\nEscribi *ayuda* para conocer los comandos que tengo disponibles.', 
    error_obtencion_ficha_cereales : '😢 No se pudo obtener su ficha de cereal. Parámetros insuficientes o la búsqueda no arrojó ningún resultado, inténte nuevamente !!\n\n🤖 Escribi *menu* para volver al menú principal o 4️⃣ para volver al resumen de cereales.', 
    error_obtencion_ficha_romaneos : '😢 No se pudo obtener su ficha de romaneos. Parámetros insuficientes o la búsqueda no arrojó ningún resultado, inténte nuevamente !!\n\n🤖 Escribi *menu* para volver al menú principal o 4️⃣ para volver al resumen de cereales.', 
    error_obtener_cotizaciones : '😢 No se pudo obtener las cotizaciones del BNA. Inténtelo nuevamente más tarde.',
    error_general: '😢 Ocurrió un error inesperado, por favor intente nuevamente más tarde.',
    mensaje_aguarde : "⏳ Aguarde un momento por favor, estoy buscando la información solicitada... 🤖",
    mensaje_volver : `\n\n_Escribí el número o comando correspondiente, o escribí "*menu*" para volver al menú principal._\n`,
    mensaje_error_comando :'❓ No entendí tu mensaje. Escribí *menu* para volver al menú principal.',
    comando_desconocido :  `🤷 No entiendo tu mensaje:\n\nPor favor, intenta con otro comando o escribi *menu* para ver las opciones disponibles.`,
    noAutorizado : '❌ Su celular no está autorizado para interactuar con este bot, por favor contáctese con su cooperativa asociada para activar su número.\n\n📢 Si su número de celular ya fue asociado por la cooperativa y no le he respondido con el menú de opciones, entonces contáctese con el área de soporte técnico al '+info.telefonoSoporte+', para habiltar su número correctamente.\n\n Hasta pronto !! 👋',
    felicitaciones_registro : '🎉Felicitaciones !!! \n\n👍 El registro fue exitoso. Ahora puedes usar el bot.\n\n🤖 Ecribí *menu* para conocer los comandos que tengo disponibles.',
}
module.exports = mensajes;