const express = require('express');
const dotenv = require('dotenv');
const { startBot } = require('../bot/index'); // Importa correctamente la función startBot

dotenv.config();
const app = express();

app.use(express.json());

// Endpoint para iniciar el bot y generar el QR
app.get('/start-bot', async (req, res) => {
  try {
    await startBot(); // Llama a la función startBot
    res.status(200).json({ message: 'Bot iniciado. Escanea el QR en la terminal.' });
  } catch (error) {
    console.error('Error al iniciar el bot:', error);
    res.status(500).json({ error: 'Error al iniciar el bot.' });
  }
});

// Puerto desde .env o default
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`📡 API escuchando en http://localhost:${PORT}`);
});