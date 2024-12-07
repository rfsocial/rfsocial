const ChatDAO = require('../dao/ChatroomDAO');
const MessageDAO = require('../dao/MessageDAO');
const UserDAO = require('../dao/UserDAO');
const dayjs = require('dayjs');
const chatroom = require("../models/Chatroom");

class ChatroomController {
    static async createChatroom(req, res) {
        try {
            const {group_chat, name} = req.body;
            const dateString = dayjs().format('YYYY-MM-DD HH:mm');
            const created_at = new Date(dateString);

            const chatroom = await ChatDAO.createChatroom(group_chat, name, created_at);

            if (chatroom) return res.status(201).json(chatroom);
            return res.status(500).json({message: 'Nem sikerült a chatroom létrehozása'});
        } catch (err) {
            console.error(err);
            return res.status(500).json({message: "HIBA (ChatroomController.createChatroom)", error: err});
        }
    }

    static async getChatroomById(req, res) {
        try {
            const {chat_id} = req.params;
            const chatroom = await ChatDAO.getChatroomById(chat_id);

            if (chatroom) return res.status(200).json(chatroom);
            return res.status(404).json({message: 'A chat nem található'});
        } catch (err) {
            console.error(err);
            return res.status(500).json({message: "HIBA (ChatroomController.getChatroomById)", error: err});
        }
    }

    /*static async getChatMessagesStructure(req, res) {
        try {
            const userId = req.params.user_id;
            const chatrooms = await ChatDAO.getChatroomsByUserId(userId);
            console.log(chatrooms);
            if(chatrooms.length === 0) {
                return res.status(404).json({ message: "Nincsenek üzenetek"} );
            }
            const chatMessages = [];

            for (const chatroom of chatrooms) {
                const messages = await MessageDAO.getMessagesByChatId(chatroom.id);
                const chatUsers = await ChatDAO.getChatroomUsers(chatroom.id);

                console.log(messages);
                console.log(chatUsers);

                const type = chatroom.group_chat ? 'group' : 'private';
                const chatName = type === 'private' ?
                    chatUsers.find(user => user.user_id !== userId)?.name || "Unknown"
                    : chatroom.name;

                const formattedMessages = messages.map(message => ({
                    id: message.id,
                    sender: chatUsers.find(user => user.user_id === message.sender_id)?.name || "Unknown",
                    message: message.text,
                    timeSent: dayjs(message.date).format('YYYY-MM-DD HH:mm')
                }));

                chatMessages.push({chatName, type, messages: formattedMessages});
            }

            return res.render('../partials/chat-desktop-template', { userId }).json({ chatRooms: chatrooms, chatMessages: chatMessages});
        } catch (err) {
            console.error("HIBA (ChatroomController.getChatMessagesStructure):", err);
            return res.status(500).json({message: "HIBA (ChatroomController.getChatMessagesStructure)", error: err});
        }
    }*/

    static async getChatMessagesStructure(req, res) {
        try {
            const userId = req.params.user_id;
            const chatrooms = await ChatDAO.getChatroomsByUserId(userId);

            if (chatrooms.length === 0) {
                return res.status(404).json({ message: "Nincsenek üzenetek" });
            }

            const chatMessages = await Promise.all(chatrooms.map(async (chatroom) => {
                const messages = await MessageDAO.getMessagesByChatId(chatroom.id);
                const chatUsers = await ChatDAO.getChatroomUsers(chatroom.id);
                const type = chatroom.group_chat ? 'group' : 'private';

                let chatName;
                if(type === 'private') {
                    const otherChatRoomUser = chatUsers.find(user => user.user_id !== Number(userId));
                    const otherUser = await UserDAO.getUserById(otherChatRoomUser.user_id);
                    chatName = otherUser.username;
                } else {
                    chatName = chatroom.name;
                }
                /*const chatName = type === 'private'
                    ? chatUsers.find(user => user.user_id !== Number(userId))?.name || "Unknown"
                    : chatroom.name;*/


                const formattedMessages = await Promise.all(messages.map(async (message) => {
                    const messageSender = chatUsers.find(user => user.user_id === message.sender_id);
                    const messageSenderUser = await UserDAO.getUserById(messageSender.user_id);
                    const formattedTime = dayjs(message.date).format('YYYY-MM-DD HH:mm');

                    return {
                        id: message.id,
                        sender: messageSenderUser.username || "Unknown",
                        message: message.text,
                        timeSent: formattedTime,
                        chatName // Ha szükséges
                    };
                }));

                return { id: chatroom.id, chatName, type, messages: formattedMessages };
            }));
            return res.status(200).json({ chatRooms: chatrooms, chatMessages });
        } catch (err) {
            console.error("HIBA (ChatroomController.getChatMessagesStructure):", err);
            return res.status(500).json({ message: "HIBA", error: err });
        }
    }


    static async setChatroomName(req, res) {
        try {
            const {chat_id} = req.params;
            const {name} = req.body;
            await ChatDAO.setChatroomName(chat_id, name);

            return res.status(204).end();
        } catch (err) {
            console.error(err);
            return res.status(500).json({message: "HIBA (ChatroomController.setChatroomName)", error: err});
        }
    }

    static async deleteChatroom(req, res) {
        try {
            const {chat_id} = req.params;
            await ChatDAO.deleteChatroom(chat_id);

            return res.status(204).end();
        } catch (err) {
            console.error(err);
            return res.status(500).json({message: "HIBA (ChatroomController.deleteChatroom)", error: err});
        }
    }

    static async addUserToChatroom(req, res) {
        try {
            const {chat_id} = req.params;
            const {user_ids} = req.body;
            await ChatDAO.addUserToChatroom(chat_id, user_ids);

            return res.status(204).end();
        } catch (err) {
            console.error(err);
            return res.status(500).json({message: "HIBA (ChatroomController.addUsersToChatroom)", error: err});
        }
    }

    static async removeUserFromChatroom(req, res) {
        try {
            const {chat_id} = req.params;
            const {user_id} = req.body;
            await ChatDAO.removeUserFromChatroom(chat_id, user_id);

            return res.status(204).end();
        } catch (err) {
            console.error(err);
            return res.status(500).json({message: "HIBA (ChatroomController.removeUsersFromChatroom)", error: err});
        }
    }

    static async getChatroomsByUserId(req, res) {
        try {
            const {user_id} = req.params;
            const chatrooms = await ChatDAO.getChatroomsByUserId(user_id);

            return res.status(200).json(chatrooms);
        } catch (err) {
            console.error(err);
            return res.status(500).json({message: "HIBA (ChatroomController.getChatroomsByUserId)", error: err});
        }
    }

    static async getChatroomUsers(req, res) {
        try {
            const {chat_id} = req.params;
            const chatroomUsers = await ChatDAO.getChatroomUsers(chat_id);

            return res.status(200).json(chatroomUsers);
        } catch (err) {
            console.error(err);
            return res.status(500).json({message: "HIBA (ChatroomController.getChatroomUsers)", error: err});
        }
    }

    static async isUserInChatroom(req, res) {
        try {
            const {chat_id, user_id} = req.params;
            const isUserInChatroom = await ChatDAO.isUserInChatroom(chat_id, user_id);

            return res.status(200).json(isUserInChatroom);
        } catch (err) {
            console.error(err);
            return res.status(500).json({message: "HIBA (ChatroomController.isUserInChatroom)", error: err});
        }
    }

    static async isAdmin(req, res) {
        try {
            const {chat_id, user_id} = req.params;
            const isAdmin = await ChatDAO.getAdmin(chat_id);

            if (isAdmin && isAdmin.user_id === user_id) return res.status(200).json(true);
        } catch (err) {
            console.error(err);
            return res.status(500).json({message: "HIBA (ChatroomController.isAdmin)", error: err});
        }
    }

    static async setAdmin(req, res) {
        try {
            const {chat_id, user_id} = req.params;
            await ChatDAO.setAdmin(chat_id, user_id);

            return res.status(204).end();
        } catch (err) {
            console.error(err);
            return res.status(500).json({message: "HIBA (ChatroomController.setAdmin)", error: err});
        }
    }

    static async getAllChatrooms(req, res) {
        try {
            const chatrooms = await ChatDAO.getAllChatrooms();

            return res.status(200).json(chatrooms);
        } catch (err) {
            console.error(err);
            return res.status(500).json({message: "HIBA (ChatroomController.getAllChatrooms)", error: err});
        }
    }
}

module.exports = ChatroomController;