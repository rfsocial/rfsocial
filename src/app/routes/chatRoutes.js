const express = require('express');
const ChatroomController = require('../controllers/chatroomController');

const router = express.Router();

router.post('/chat', ChatroomController.createChatroom);

router.get('/chat/:chat_id', ChatroomController.getChatroomById);

router.put('/chat/:chat_id/name', ChatroomController.setChatroomName);

router.delete('/chat/:chat_id', ChatroomController.deleteChatroom);

router.post('/chat/:chat_id/users', ChatroomController.addUserToChatroom);

router.delete('/chat/:chat_id/users', ChatroomController.removeUserFromChatroom);

router.get('/users/:user_id/chat', ChatroomController.getChatroomsByUserId);

router.get('/chat/:chat_id/users', ChatroomController.getChatroomUsers);

router.get('/chat/:chat_id/users/:user_id', ChatroomController.isUserInChatroom);

router.get('/chat/:chat_id/users/:user_id/admin', ChatroomController.isAdmin);

router.put('/chat/:chat_id/users/:user_id/admin', ChatroomController.setAdmin);

router.get('/chat', ChatroomController.getAllChatrooms);

router.get('/users/:user_id/chat-messages', ChatroomController.getChatMessagesStructure);


module.exports = router;
