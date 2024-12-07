const MessageDAO = require('../dao/MessageDAO');
const dayjs = require('dayjs');

class MessageController {
    static async createMessage(req, res) {
        try {
            const {text, attachment, sender_id, chat_id} = req.body;
            const dateString = dayjs().format('YYYY-MM-DD HH:mm');
            const date = new Date(dateString);

            const message = await MessageDAO.createMessage(text, attachment, sender_id, chat_id, date);

            if (message) return res.status(201).json(message);
            return res.status(500).json({message: 'Nem sikerült az üzenet létrehozása'});
        } catch (err) {
            console.error(err);
            return res.status(500).json({message: "HIBA (MessageController.createMessage)", error: err});
        }
    }

    static async getMessagesByChatId(req, res) {
        try {
            const chat_id = parseInt(req.params.chat_id);
            const messages = await MessageDAO.getMessagesByChatId(chat_id);

            return res.status(200).json(messages);
        } catch (err) {
            console.error(err);
            return res.status(500).json({message: "HIBA (MessageController.getMessagesByChatId)", error: err});
        }
    }

    static async getMessageById(req, res) {
        try {
            const message_id = parseInt(req.params.id);
            const message = await MessageDAO.getMessageById(message_id);

            if (message) return res.status(200).json(message);
            return res.status(404).json({message: 'Az üzenet nem található'});
        } catch (err) {
            console.error(err);
            return res.status(500).json({message: "HIBA (MessageController.getMessageById)", error: err});
        }
    }

    static async deleteMessageById(req, res) {
        try {
            const message_id = parseInt(req.params.id);
            await MessageDAO.deleteMessageById(message_id);

            return res.status(204).end();
        } catch (err) {
            console.error(err);
            return res.status(500).json({message: "HIBA (MessageController.deleteMessageById)", error: err});
        }
    }

    static async updateMessage(req, res) {
        try {
            const message_id = parseInt(req.params.id);
            const {text, attachment} = req.body;
            const message = await MessageDAO.getMessageById(message_id);

            if (message) {
                const updatedMessage = await MessageDAO.updateMessageById(message_id, text);
                return res.status(200).json(updatedMessage);
            }
            return res.status(404).json({message: 'Az üzenet nem található'});
        } catch (err) {
            console.error(err);
            return res.status(500).json({message: "HIBA (MessageController.updateMessage)", error: err});
        }
    }

    static async getUnreadMessagesByUserId(req, res) {
        try {
            const user_id = parseInt(req.params.user_id);
            const messages = await MessageDAO.getAllUnreadMessagesByUserId(user_id);

            return res.status(200).json(messages);
        } catch (err) {
            console.error(err);
            return res.status(500).json({message: "HIBA (MessageController.getUnreadMessagesByUserId)", error: err});
        }
    }

    static async getUnreadMessagesByChatId(req, res) {
        try {
            const chat_id = parseInt(req.params.chat_id);
            const messages = await MessageDAO.getMessagesByChatId(chat_id);

            return res.status(200).json(messages);
        } catch (err) {
            console.error(err);
            return res.status(500).json({message: "HIBA (MessageController.getUnreadMessagesByChatId)", error: err});
        }
    }

    static async readMessage(req, res) {
        try {
            const message_id = parseInt(req.params.id);
            const message = await MessageDAO.getMessageById(message_id);

            if (message) {
                const updatedMessage = await MessageDAO.readMessage(message_id);
                return res.status(200).json(updatedMessage);
            }
            return res.status(404).json({message: 'Az üzenet nem található'});
        } catch (err) {
            console.error(err);
            return res.status(500).json({message: "HIBA (MessageController.readMessage)", error: err});
        }
    }

    static async renderMobileChatView(req, res) {
        return res.render('chat-desktop-template.ejs', { userId: req.user.id });
    }
}

module.exports = MessageController;