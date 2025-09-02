/*const axios = require('axios');
require('dotenv').config();
const API_KEY_OPEN_IA = process.env.API_KEY_OPEN_IA;

module.exports = async (sock, from, text) => {
  try {
    const prompt = text.trim();

    if (!prompt) {
      await sock.sendMessage(from, { text: '🤖 Por favor, escribe algo para enviar a ChatGPT 💬.' });
      return;
    }

    console.log('🔑 API Key cargada:', API_KEY_OPEN_IA);

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200,
        temperature: 0.7,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${API_KEY_OPEN_IA}`,
        },
      }
    );

    const reply = response.data.choices[0].message.content.trim();
    await sock.sendMessage(from, { text: reply });
  } catch (error) {
    console.error('Error al interactuar con ChatGPT 💬:', error.response?.data || error.message);
    await sock.sendMessage(from, { text: '🤖 Ocurrió un error al interactuar con ChatGPT.\nPor favor, inténtalo más tarde.' });
  }
};*/