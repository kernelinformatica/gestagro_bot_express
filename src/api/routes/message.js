const express = require('express');
const sendMessageController = require('../../controllers/sendMessage');
const router = express.Router();

// POST /send-message
router.post('/', sendMessageController);

module.exports = router;