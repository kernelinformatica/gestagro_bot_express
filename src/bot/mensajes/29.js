import { coope as obj, config as conf, info } from '../config.js';
const cli = obj["15"] || obj['default'];

const presentacion = ""
const mensajes = {
    gestagro : '🤖👋 Hola soy *'+cli.nombreBot+'* el asistente virtual de *_'+cli.clienteNombre+'_*, te cuento quién soy:\n\nSoy un sistema pensado y diseñado para el sector agropecuario para ofrecerle servicios agrícolas a nuestros asociados.\n\n*UN POCO DE HISTORIA:*\n\n20 DE JUNIO DE 1953 un grupo de no más de 50 personas aferradas a su presente, pensando en el futuro, con el corazón abierto para servir sin claudicaciones, en el local de Federación Agraria Argentina de  la localidad de Aranguren, dieron vida a COOPAR\n\n_Escribi *menu* para conocer los comandos que tengo disponibles._',
    numero_no_asociado : '🤖👋 Hola soy *'+cli.nombreBot+'* el asistente virtual de '+cli.clienteNombre+'.\n\n🚫 Su celular no esta asociado a la cooperativa con la que intenta interactuar.\n\nComuniquese con su cooperativa asociada para habilitar su número.\n\nHasta pronto !! 👋' ,
    menu: '🤖 Hola 👋 soy *'+cli.nombreBot+'* el asistente virtual de '+cli.clienteNombre+'\n\n ¿En qué puedo ayudarte hoy?\n\n1️⃣💰 Saldo en Pesos\n2️⃣💰 Saldo en dolares. \n3️⃣ Resumen de cereales  \ \n4️⃣ Mercado Disponible. \n5️⃣ Mercado Futuro.\n6️⃣ Mercado cambiario Banco Nacion. \n7️⃣ Información útil de contacto.\n8️⃣ Desvincular mi número', 
    menu_cuenta : '🤖 Menú Cuenta:\n1. *cambiarclave* → Cambiar clave de acceso a plataforma web.\n2. *cambiarmail* → Cambiar email registrado en plataforma web. \n',
    menu_resumen_ctacte_pesos :'🤖 Si desea descargar el resumen en pesos en formato pdf, escribí "resumen" o ingresa el número "10"\n', 
    menu_resumen_ctacte_dolar :'🤖 Si desea descargar el resumen en dólares en formato pdf, escribí "resumendolar" o ingresa el número "11"\n', 
    menu_detalle_ficha_cereal :'🤖 Si desea descargar la ficha de cereal en formato pdf, escribí "fice" o ingresa el número "5"\n',
    menu_respuesta_descarga :'✅ ¡Lo pedís acá lo tenés! ☝️ Acá te envío la informacíon que me solicitaste.\n\n_Escribí "*menu*" para volver al menú principal_',
    error_solicitud : '😢 No se pudo procesar tu solicitud en este momento, intenta nuevamente más tarde.',
    mercado_cereales_futuros_sin_datos: '😢 No hay datos publicados para el mercado de cereales en este momento.\n\n\Inténtelo nuevamente más tarde.',
    mercado_cereales_disponible_sin_datos: '😢 No hay datos publicados para el mercado de disponible en este momento.\n\n\Inténtelo nuevamente más tarde.',
    error_comando :'⚠️ Comando no reconocido.',
    error_comando_proceso : '😢 Error al procesar el comando solicitado:',
    error_obtencion_saldos : '😢 No se pudo obtener el saldo requerido en este momento, inténte nuevamente más tarde.\n\nEscribi *menu* para conocer los comandos que tengo disponibles.', 
    error_obtencion_resumen_ctacte : '😢 No se pudo obtener el resumen completo de su cuenta en pesos.\nEscribi *ayuda* para conocer los comandos que tengo disponibles.', 
    error_obtencion_ficha_cereales : '😢 No se pudo obtener su ficha de cereal. Parámetros insuficientes o la búsqueda no arrojó ningún resultado, inténte nuevamente !!\n\n🤖 Escribi *menu* para volver al menú principal.', 
    error_obtencion_ficha_romaneos : '😢 No se pudo obtener su ficha de romaneos. Parámetros insuficientes o la búsqueda no arrojó ningún resultado, inténte nuevamente !!\n\n🤖 Escribi *menu* para volver al menú principal.', 
    error_obtener_cotizaciones : '😢 No se pudo obtener las cotizaciones del BNA. Inténtelo nuevamente más tarde.',
    error_general: '😢 Ocurrió un error inesperado, por favor intente nuevamente más tarde.',
    mensaje_aguarde : "Aguarde un momento por favor...",
    mensaje_volver : `\n\n_Escribí el número o comando correspondiente, o escribí "*menu*" para volver al menú principal._\n`,
    mensaje_error_comando :'❓ No entendí tu mensaje. Escribí *menu* para volver al menú principal.',
    comando_desconocido :  `🤷 No entiendo tu mensaje:\n\nPor favor, intenta con otro comando o escribi *menu* para ver las opciones disponibles.`,
    noAutorizado : '❌ Su celular no está autorizado para interactuar con este bot, por favor contáctese con su cooperativa asociada para activar su número.\n\n📢 Si su número de celular ya fue asociado por la cooperativa y no le he respondido con el menú de opciones, entonces contáctese con el área de soporte técnico al '+info.telefonoSoporte+', para habiltar su número correctamente.\n\n Hasta pronto !! 👋',
    registro_cuenta : '🤖 Para registrarte y comenzar a usar el bot, necesito que me proporciones tu número de cuenta.\n\n🔢 Por favor, ingresa tu número de cuenta (sin espacios ni guiones):',
    registro_cuenta_pedida : '🔢 Por favor, ingresa tu número de cuenta (sin espacios ni guiones):',
    registro_cuenta_invalida :  '😢 ❌ El número de cuenta que ingresaste no es válido. Por favor, verifica e ingresa un número de cuenta correcto (solo números, sin espacios ni guiones):',
    registro_no_registrado : '😢 ❌ No estás registrado como asociado.\n\nPara poder operar, por favor, ingresa tu número de cuenta de socio proporcionado por la _'+cli.clienteNombre+'_ para poder validar tu usuario y tu número.',
    registro_solicita_clave: '✅ 🔐 Ahora, por favor, ingresa la clave de acceso que utilizas para la plataforma web de la Cooperativa.',
    registro_clave_error: '😢 ❌ La clave ingresada es incorrecta. Por favor, verifica e ingresa la clave correcta.\n\nSi no recuerda su clave, póngase en contacto con la Cooperativa.\n\nAhora ingresá nuevamente el nro de cuenta.',
    registro_error_general : '😢 Ocurrió un error inesperado durante el registro. Por favor, intenta nuevamente más tarde.' ,
    registro_clave_invalida: '🔑 ❌ La clave ingresada no es válida. Asegúrate de que la clave no contenga espacios. Por favor, ingresa una clave válida.\n\nSi no recuerda su clave, póngase en contacto con la Cooperativa.\n\nAhora ingresá nuevamente el nro de cuenta.',
    felicitaciones_registro : '✅ 🎉Felicitaciones !!! \n\n👍 El registro fue exitoso. Ahora puedes usar el bot.\n\n🤖 Ecribí *menu* para conocer los comandos que tengo disponibles.',
    // solicitud de dinero
    sf_pregunta_fecha_acreditacion: "¿Qué fecha de acreditación prefiere?, ingrese YYYY-MM-DD' (por ejemplo, 1900-01-01).",
    sf_pregunta_cantidad_dinero: "¿Cuál es el monto que desea solicitar?\n\n_Por favor, ingrese la cantidad en pesos argentinos (ARS)._",
    sf_ingrese_cantidad_valida: "⚠️ La cantidad ingresada no es válida.\n\n_Por favor, ingrese un monto numérico positivo en pesos argentinos (ARS)._",
    sf_ingrese_una_opcion_valida : 'Por favor, seleccione una opción válida (A, B, C).',
    sf_solicitud_procesando :"⏳ Procesando su solicitud, por favor espere...",
    sf_solicitud_exito: "✅ Su solicitud ha sido procesada con éxito:\n",
    sf_solicitud_error : `❌ Su solicitud no se pudo procesar debido a un error inesperado, inténte nuevamente más tarde.\n\nEscriba *"menu"* para volver al menú principal.`,
    sf_solicitud_condiciones: "📝 _Tenga en cuenta que las solicitudes de dinero, se tramitarán y se resolverán en un lapso máximo de 48 hs, desde el día que se realizó el pedido._",
    sf_salida_flujo_transferencias : '✅ Has salido del menu PEDIDO DE FONDOS. Escribe *"menu"* para volver al menú principal.',
    // subir imagenes
    mensaje_operacion_no_permitida : '😢 Lo siento, no estás autorizado para realizar esta operación.' ,

}
export default mensajes ;