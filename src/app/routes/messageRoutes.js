const express = require('express');
const router = express.Router();
const MessageController = require('../controllers/messageController');
const validateMessage = require('../middleware/messageMiddleware');

router.post('/', validateMessage, MessageController.createMessage);

router.get('/chat/:chat_id', MessageController.getMessagesByChatId);

router.get('/:id', MessageController.getMessageById);

router.delete('/:id', MessageController.deleteMessageById);

router.put('/:id', validateMessage, MessageController.updateMessage);

router.get('/chat-mobile-view', MessageController.renderMobileChatView);

// TODO: Olvasatlan/Olvasott üzenetek

module.exports = router;
