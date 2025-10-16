import express from 'express';
import sendMessageController from '../../controllers/sendMessage.js';
const router = express.Router();

// POST /send-message
router.post('/', sendMessageController);

module.exports = router;