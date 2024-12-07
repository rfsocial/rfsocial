const database = require('../config/db');
const Chatroom = require('../models/Chatroom');
const ChatroomUser = require('../models/ChatroomUser');

class ChatroomDAO {
    /**
     * Létrehoz egy új chat szobát.
     *
     * @param {boolean} group_chat - A csoportos chat.
     * @param {string} name - A chat neve.
     * @param {Date} created_at - A chat létrehozásának dátuma.
     * @returns {Promise<Chatroom>} - A létrehozott chat.
     * @throws {Error}
     */
    static async createChatroom(group_chat, name, created_at) {
        console.log("ChatroomDAO.createChatroom", group_chat, name, created_at);

        try {
            console.log("ChatroomDAO.createChatroom try");

            const result = await database.query(
                `INSERT INTO Chatrooms (group_chat, name, created_at)
                 VALUES ($1, $2, $3)
                 RETURNING *`,
                [group_chat, name, created_at]
            );

            console.log("ChatroomDAO.createChatroom result", result);
            return ChatroomDAO.chatroomFromRow(result.rows[0]);
        } catch (err) {
            console.error("HIBA (ChatroomDAO.createChatroom):", err);
            throw err;
        }
    };


    /**
     * Visszaadja a chat id alapján.
     *
     * @param {number} chat_id - A chat id-je.
     * @returns {Promise<Chatroom>} - A megtalált chat.
     * @throws {Error}
     */
    static async getChatroomById(chat_id) {
        try {
            const result = await database.query(
                `SELECT * FROM Chatrooms WHERE id = $1`,
                [chat_id]
            );
            return ChatroomDAO.chatroomFromRow(result.rows[0]);
        } catch (err) {
            console.error("HIBA (ChatroomDAO.getChatroomById):", err);
            throw err;
        }
    };


    /**
     * Frissíti a chat nevét.
     *
     * @param {number} chat_id - A chat id-je.
     * @param {string} name - Az új név.
     * @returns {Promise<void>}
     * @throws {Error}
     */
    static async setChatroomName(chat_id, name) {
        try {
            await database.query(
                `UPDATE Chatrooms SET name = $2 WHERE id = $1`,
                [chat_id, name]
            );
        } catch (err) {
            console.error("HIBA (ChatroomDAO.setChatroomName):", err);
            throw err;
        }
    }

    /**
     * Törli a chat id alapján.
     *
     * @param {number} chat_id - A chat id-je.
     * @returns {Promise<void>}
     * @throws {Error}
     */
    static async deleteChatroom(chat_id) {
        try {
            await database.query(
                `DELETE FROM Chatrooms WHERE id = $1`,
                [chat_id]
            );
        } catch (err) {
            console.error("HIBA (ChatroomDAO.deleteChatroom):", err);
            throw err;
        }
    }


    /**
     * Hozzáad egy user-t a chat.
     *
     * @param {number} chat_id - A chat id-je.
     * @param {number} user_id - A felhasználó id-je.
     * @returns {Promise<ChatroomUser>} - A hozzáadot felhasználó.
     * @throws {Error}
     */
    static async addUserToChatroom(chat_id, user_id) {
        try {
            const result = await database.query(
                `INSERT INTO Chatroom_users (chatroom_id, user_id, is_admin)
                 VALUES ($1, $2, $3)
                 RETURNING *`,
                [chat_id, user_id]
            );
            return ChatroomDAO.chatroomUserFromRow(result.rows[0]);
        } catch (err) {
            console.error("HIBA (ChatroomDAO.addUserToChatroom):", err);
            throw err;
        }
    };

    /**
     * Eltávolít egy user-t a chat.
     *
     * @param {number} chat_id - A chat id-je.
     * @param {number} user_id - A felhasználó id-je.
     * @returns {Promise<void>}
     * @throws {Error}
     */
    static async removeUserFromChatroom(chat_id, user_id) {
        try {
            await database.query(
                `DELETE FROM Chatroom_users WHERE chatroom_id = $1 AND user_id = $2`,
                [chat_id, user_id]
            );
        } catch (err) {
            console.error("HIBA (ChatroomDAO.removeUserFromChatroom):", err);
            throw err;
        }
    };

    /**
     * Visszaadja a chat-hez tartozó felhasználókat.
     *
     * @param {number} chat_id - A chat id.
     * @returns {Promise<ChatroomUser[]>} - A chat felhasználóinak listája.
     * @throws {Error}
     */
    static async getChatroomUsers(chat_id) {
        try {
            const result = await database.query(
                `SELECT * FROM Chatroom_users WHERE chatroom_id = $1`,
                [chat_id]
            );
            return result.rows.map(ChatroomDAO.chatroomUserFromRow);
        } catch (err) {
            console.error("HIBA (ChatroomDAO.getChatroomUsers):", err);
            throw err;
        }
    };

    /**
     * Ellenőrzi, hogy egy felhasználó a chat tagja-e.
     *
     * @param {number} chat_id - A chat id-je.
     * @param {number} user_id - A felhasználó id-je.
     * @returns {Promise<boolean>} - TRUE: ha a felhasználó a chat tagja; FALSE: ha nem.
     * @throws {Error}
     */
    static async isUserInChatroom(chat_id, user_id) {
        try {
            const result = await database.query(
                `SELECT COUNT(*) > 0 AS exists                                 
                 FROM Chatroom_users WHERE chatroom_id = $1 AND user_id = $2`,
                [chat_id, user_id]
            );
            return result.rows[0]?.exists || false;
        } catch (err) {
            console.error("HIBA (ChatroomDAO.isUserInChatroom):", err);
            throw err;
        }
    };

    /**
     * Visszaadja az összes chat-et, amelyben a felhasználó benne van
     *
     * @param {number} user_id - A felhasználó id.
     * @returns {Promise<Chatroom[]>} - A chatek listája.
     * @throws {Error}
     */
    static async getChatroomsByUserId(user_id) {
        try {
            const result = await database.query(
                `SELECT * FROM Chatrooms
                 WHERE id IN (
                     SELECT chatroom_id FROM Chatroom_users WHERE user_id = $1
                 )`,
                [user_id]
            );
            return result.rows.map(ChatroomDAO.chatroomFromRow);
        } catch (err) {
            console.error("HIBA (ChatroomDAO.getChatroomsByUserId):", err);
            throw err;
        }
    };


    /**
     * Visszaadja a chat adminját.
     *
     * @param {number} chat_id - A chat id.
     * @returns {Promise<ChatroomUser>} - Az admin felhasználó
     * @throws {Error}
     */
    static async getAdmin(chat_id) {
        try {
            const result = await database.query(
                `SELECT * FROM Chatroom_users
                 WHERE chatroom_id = $1 AND is_admin = true`,
                [chat_id]
            );
            return ChatroomDAO.chatroomUserFromRow(result.rows[0]);
        } catch (err) {
            console.error("HIBA (ChatroomDAO.getAdmin):", err);
            throw err;
        }
    };

    /**
     * Admin-t ad a user-nek a chat-ben.
     *
     * @param {number} chat_id - A chat id.
     * @param {number} user_id - A felhasználó id.
     * @returns {Promise<void>}
     * @throws {Error}
     */
    static async setAdmin(chat_id, user_id) {
        try {
            await database.query(
                `UPDATE Chatroom_users SET is_admin = true
                 WHERE chatroom_id = $1 AND user_id = $2`,
                [chat_id, user_id]
            );
        } catch (err) {
            console.error("HIBA (ChatroomDAO.setAdmin):", err);
            throw err;
        }
    };

    /**
     * Visszaadja az összes chat szobát. --Hátha kell.
     *
     * @returns {Promise<Chatroom[]>} - Az összes chat szoba listája.
     * @throws {Error}
     */
    static async getAllChatrooms() {
        try {
            const result = await database.query(`SELECT * FROM Chatrooms`);
            return result.rows.map(ChatroomDAO.chatroomFromRow);
        } catch (err) {
            console.error("HIBA (ChatroomDAO.getAllChatrooms):", err);
            throw err;
        }
    };

    static chatroomFromRow(row) {
        if (!row) return null;
        return new Chatroom(
            row.id,
            row.group_chat,
            row.name,
            row.created_at
        )
    }

    static chatroomUserFromRow(row) {
        if (!row) return null;
        return new ChatroomUser(
            row.chatroom_id,
            row.user_id,
            row.isAdmin
        )
    }
}


module.exports = ChatroomDAO;