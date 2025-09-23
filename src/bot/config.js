const config = {
    timeOut: 15000,
    reintentos: 3,
    apiPropietaria : false, // Si la API es de una cooperativa es global para todos los clientes
    
    cliente : 0,  
    puerto: 3001, // puerto del servidor donde corre la API
    clienteAlias : "Gestagro Bot",
    clienteNombre : "Gestagro Servicios Digitales Agropecuarios.",
                
    clienteLogo: "/home/administrador/chatbot-gestagro/bot/src/assets/logos/gestagro.png",
    clienteRobotImg: "/home/administrador/chatbot-gestagro/bot/src/assets/robots/gestagro-bot.jpg",


    /*
    cliente : 11,  
    puerto: 3002, // puerto del servidor donde corre la API
    clienteAlias : "ARA",
    clienteNombre : "Cooperativa Agrícola Ganadera y de Servicios Públicos de Aranguren LTDA.",
    clienteLogo: "/home/administrador/chatbot-gestagro/bot-coopar/src/assets/logos/11.png",
    clienteRobotImg: "/home/administrador/chatbot-gestagro/bot-coopar/src/assets/robots/coopar-bot.jpg",
    */

    
    /*
    cliente : 29, 
    puerto: 3003, // puerto del servidor donde corre la API 
    clienteAlias : "GOB CRESPO BOT",
    clienteNombre : XXX",
    clienteLogo: "/home/administrador/chatbot-gestagro/bot-coopar/src/assets/logos/11.png",
    clienteRobotImg: "/home/administrador/chatbot-gestagro/bot-coopar/src/assets/robots/gcrespo-bot.jpg",
    */


    /*cliente : 12,  
    puerto: 3004, 
    clienteAlias : "GODOY BOT",
    clienteNombre : "COOPERATIVA AGRICOLA DE GODOY LIMITADA.",
    clienteLogo: "/home/administrador/chatbot-gestagro/bot-godoy/src/assets/logos/12.png",
    clienteRobotImg: "/home/administrador/chatbot-gestagro/bot-godoy/src/assets/robots/godoy-bot.jpg",
    */
    
    mensajesConLogo : "S"
    
    

};
const clientesCodigo = {
    1: '01',
    3: '03',
    5: '05',
    6: '06',
    11: '11',
    12: '12',
    29: '29'
  }  ;
const info = {
    nombreEmpresa: "Gestagro",
    telefonoSoporte: "3416435556",
    emailSoporte: "sistemas@kernelinformatica.com.ar",
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
        descripcionBot : "Asistente Virtual"
    },
   
    '03': {
     nombreBot :"CAUR",
     descripcionBot : "Asistente Virtual"
       
    },
    '05': {
     nombreBot :"COOPAZ",
     descripcionBot : "Asistente Virtual"
    },
    '06': {
     nombreBot :"COOP MARGARITA BOT",
     descripcionBot : "Asistente Virtual"
    },
    '11': {
     nombreBot :"ARA",
     descripcionBot : "Asistente Virtual"
    },
    '12': {
     nombreBot :"GODOY BOT",
     descripcionBot : "Asistente Virtual"
    },
    'default': {
        nombreBot :"GESTAGRO",
        descripcionBot : "Asistente Virtual"
    },
    
}

module.exports = {
    info,
    config,
    api,
    coope,
    clientesCodigo
  };
  