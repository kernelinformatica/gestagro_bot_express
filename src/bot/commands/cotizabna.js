const axios = require('axios');
const cheerio = require('cheerio');
const mensajes = require('../../bot/mensajes/default');
const { api, config } = require('../config');
const { formatterPrecios } = require('../utils');
const fs = require('fs'); 
module.exports = async (sock, from, text, msg) => {
  await sock.sendMessage(from, { text: "⏳"+mensajes.mensaje_aguarde});
  try {
    const { data: html } = await axios.get(api.URL_BNA);
    const $ = cheerio.load(html);
    const imagen = fs.readFileSync(config.clienteRobotImg);
    const cotizaciones = [];
    $('table tbody tr').each((_, row) => {
      const cols = $(row).find('td');
      const moneda = $(cols[0]).text().trim();
      const compra = $(cols[1]).text().trim();
      const venta = $(cols[2]).text().trim();
      if (moneda && compra && venta) {
        cotizaciones.push({ moneda, compra, venta });
      }
    });

     // 🎯 Filtrar solo Dólar y Euro
     const seleccionadas = cotizaciones.filter(({ moneda }) =>
        moneda.toLowerCase().includes('dolar u.s.a') || moneda.toLowerCase().includes('euro')
      );
    let mensaje = `📊 *Cotizaciones de DIVISAS en el Mercado Libre de Cambios, al último cierre de Operaciones: ${new Date().toLocaleDateString()}*\n\n`;
    seleccionadas.forEach(({ moneda, compra, venta }) => {
        mensaje += `💱 ${moneda}\nCompra: _${formatterPrecios.format(parseFloat(compra))}_\nVenta: _${formatterPrecios.format(parseFloat(venta))}_\n\n`;
      });

    if (config.mensajesConLogo == "S"){
        await sock.sendMessage(from, { image: imagen, caption: mensaje  });
    }else{
        await sock.sendMessage(from, { text: mensaje });
    }


     
  } catch (error) {
    console.error('❌ Error al obtener cotizaciones del BNA:', error.message);
    await sock.sendMessage(from, { text: '⚠️ No se pudo obtener la cotización del Banco Nación en este momento.' });
  }
};
