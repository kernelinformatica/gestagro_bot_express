import express from 'express';
import { startBot } from '../bot/index.js';
import { config } from '../bot/config.js';
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

const PORT = process.env.PORT || config.puerto; // godoy
app.listen(PORT, () => {
  console.log(`📡 API escuchando en http://localhost:${config.puerto}`);
});