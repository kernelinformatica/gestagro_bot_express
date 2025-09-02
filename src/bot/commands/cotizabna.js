const axios = require('axios');
const cheerio = require('cheerio');
const mensajes = require('../../bot/mensajes');
const { formatterPrecios } = require('../utils');

module.exports = async (sock, from, text, msg) => {
  try {
    const { data: html } = await axios.get('https://www.bna.com.ar/Cotizador/MonedasHistorico');
    const $ = cheerio.load(html);

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

    await sock.sendMessage(from, { text: mensaje });
  } catch (error) {
    console.error('❌ Error al obtener cotizaciones del BNA:', error.message);
    await sock.sendMessage(from, { text: '⚠️ No se pudo obtener la cotización del Banco Nación en este momento.' });
  }
};
