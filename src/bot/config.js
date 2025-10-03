const config = {
    timeOut: 15000,
    reintentos: 3,
    apiPropietaria : true, // Si la API es de una cooperativa es global para todos los clientes
    
    /*cliente : 0,  
    puerto: 3001, // puerto del servidor donde corre la API
    clienteAlias : "GESTAGRO",
    clienteLogo: "/home/administrador/chatbot-gestagro/bot/src/assets/logos/gestagro.png",
    clienteRobotImg: "/home/administrador/chatbot-gestagro/bot/src/assets/robots/gestagro-bot.jpg",
    */
    /*
    cliente : 05,  
    puerto: 3005, 
    clienteAlias : "COOPAZ BOT",
    clienteNombre : "COOPERATIVA AGRICOLA DE MAXIMO PAZ LIMITADA.",
    clienteLogo: "/home/administrador/chatbot-gestagro/bot-godoy/src/assets/logos/05.png",
    clienteRobotImg: "/home/administrador/chatbot-gestagro/bot-godoy/src/assets/robots/04.jpg",
    
    */
   
    cliente : 11,  
    puerto: 3002, // puerto del servidor donde corre la API
    clienteAlias : "ARA",
    clienteNombre : "Cooperativa Agrícola Ganadera y de Servicios Públicos de Aranguren LTDA.",
    clienteLogo: "/home/administrador/chatbot-gestagro/bot-coopar/src/assets/logos/11.png",
    clienteRobotImg: "/home/administrador/chatbot-gestagro/bot-coopar/src/assets/robots/11.jpg",
    

    /*
    cliente : 29, 
    puerto: 3003, // puerto del servidor donde corre la API 
    clienteAlias : "GOB CRESPO BOT",
    clienteNombre : "Cooperativa Agrícola de Gobernador Crespo LTDA.",
    clienteLogo: "/home/administrador/chatbot-gestagro/bot-gcrespo/src/assets/logos/29.png",
    clienteRobotImg: "/home/administrador/chatbot-gestagro/bot-gcrespo/src/assets/robots/29.jpg",
    */

   /*
    cliente : 12,  
    puerto: 3004, 
    clienteAlias : "GODOY BOT",
    clienteNombre : "COOPERATIVA AGRICOLA DE GODOY LIMITADA.",
    clienteLogo: "/home/administrador/chatbot-gestagro/bot-godoy/src/assets/logos/12.png",
    clienteRobotImg: "/home/administrador/chatbot-gestagro/bot-godoy/src/assets/robots/12.jpg",
    */
    

    


    mensajesConLogo : "S"
    
    

};
const rutas = {
    // Configuración del servidor SFTP
    
    pathImagenesWeb : "/var/www/clients/client17/web21/web/i/"
    
}

const ftpUpload = {
    // ajustar estos datos para cada cooperativa
    hosts : "192.168.254.47",
    usuario: "maximopazupload",
    clave: "zRnSUzrNqDO8A9Nv",
}

const clientesCodigo = {
    1: '01',
    3: '03',
    5: '05',
    6: '06',
    11: '11',
    12: '12',
    29: '29'
  } ;
const info = {
    nombreEmpresa: "Gestagro",
    telefonoSoporte: "3416435556",
    emailSoporte: "sistemas@kernelinformatica.com.ar",
    lienteNombre : "Gestagro: Servicios Digitales Agropecuarios.",
}
const api ={
    // URLS DE LA API /////////////////////////////////////////////////////////////////////////////////
    API_URL: "http://192.168.254.15:6012",
    URL_BNA: "https://www.bna.com.ar/Cotizador/MonedasHistorico",
    URL_REPORTES_PDF: "https://dev.kernelinformatica.com.ar/reportes/generarReportePdf",
    
    // GENERALES /////////////////////////////////////////////////////////////////////////////////
    API_NOMBRE : "GESTAGRO BOT",
    API_VERSION : "1.0.0",     
    API_AUTOR : "Dario Javier Quiroga",
    

}
const coope = {
    '01': {
        nombreBot: "COOP ACEVEDO BOT",
        descripcionBot : "Asistente Virtual",
        clienteNombre : "Gestagro: Servicios Digitales Agropecuarios.",
    },
   
    '03': {
     nombreBot :"CAUR",
     descripcionBot : "Asistente Virtual",
     clienteNombre : "Gestagro: Servicios Digitales Agropecuarios.",
       
    },
    '05': {
     nombreBot :"COOPAZ",
     descripcionBot : "Asistente Virtual",
     clienteNombre : "Cooperativa Agropecuaria Ltda. de Máximo Paz.",
    },
    '06': {
     nombreBot :"COOP MARGARITA BOT",
     descripcionBot : "Asistente Virtual",
     clienteNombre : "Gestagro: Servicios Digitales Agropecuarios.",
    },
    '11': {
     nombreBot :"ARA",
     descripcionBot : "Asistente Virtual",
     clienteNombre : "Cooperativa Agropecuaria y de Servicios Públicos de Aranguren LTDA.",
    },
    '12': {
     nombreBot :"GODOY BOT",
     descripcionBot : "Asistente Virtual",
     clienteNombre : "Cooperativa Agropecuaria de Godoy LTDA.",
    },
    '29': {
     nombreBot :"COOP GCRESPO BOT",
     descripcionBot : "Asistente Virtual",
     clienteNombre : "Cooperativa Agricola Ganadera Limitada.",
    },
    

    'default': {
        nombreBot :"GESTAGRO",
        descripcionBot : "Asistente Virtual",
        clienteNombre : "Gestagro: Servicios Digitales Agropecuarios.",
    },
    
}

module.exports = {
    info,
    config,
    api,
    coope,
    clientesCodigo,
    ftpUpload,
  };
  