"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = sendMessageController;
async function sendMessageController(req, res) {
    const { to, message } = req.body;
    if (!to || !message) {
        return res.status(400).json({ error: 'Faltan parámetros: to y message son requeridos' });
    }
    try {
        // Aquí puedes integrar Baileys para enviar el mensaje
        res.json({ success: true, message: 'Mensaje enviado correctamente' });
    }
    catch (error) {
        console.error('Error al enviar mensaje:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}
