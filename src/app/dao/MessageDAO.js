const database = require('../config/db');
const Message = require('../models/Message');

class MessageDAO {
    /**
     * Létrehoz egy új üzenetet az adatbázisban.
     *
     * @param {string} text - Az üzenet szövege.
     * @param {string|null} [attachment=null] - Az üzenethez kapcsolódó csatolmány (opcionális).
     * @param {number} sender_id - A küldő azonosítója.
     * @param {number} chat_id - A chat azonosítója.
     * @param {Date} date - Az üzenet küldésének dátuma.
     * @returns {Promise<Message|null>} A létrehozott üzenet objektum, vagy null, ha hiba történt.
     * @throws {Error} Ha hiba történik az adatbázis lekérdezés során.
     */
    static async createMessage(text, attachment = null, sender_id, chat_id, date) {
        try {
            const result = await database.query(
                `INSERT INTO Messages (text, attachment, sender_id, chat_id, date)
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING *`,
                [text, attachment, sender_id, chat_id, date]
            );
            return MessageDAO.messageFromRow(result.rows[0]);
        } catch (err) {
            console.error("HIBA (MessageDAO.createMessage):", err);
            throw err;
        }
    };

    /**
     * Visszaadja a chat_id-hez tartozó üzeneteket.
     *
     * @param {number} chat_id - A chat azonosítója.
     * @returns {Promise<Message[]>} Az üzenetek listája a megadott chat azonosítóhoz.
     * @throws {Error} Ha hiba történik az adatbázis lekérdezés során.
     */
    static async getMessagesByChatId(chat_id) {
        try {
            const result = await database.query(
                `SELECT * FROM Messages WHERE chat_id = $1`,
                [chat_id]
            );
            return result.rows.map(row => MessageDAO.messageFromRow(row));
        } catch (err) {
            console.error("HIBA (MessageDAO.getMessagesByChatId):", err);
            throw err;
        }
    };

    /**
     * Visszaadja az üzenetet a message_id alapján.
     *
     * @param {number} message_id - Az üzenet azonosítója.
     * @returns {Promise<Message|null>} Az üzenet objektum, vagy null, ha nem található.
     * @throws {Error} Ha hiba történik az adatbázis lekérdezés során.
     */
    static async getMessageById(message_id) {
        try {
            const result = await database.query(
                `SELECT * FROM Messages WHERE id = $1`,
                [message_id]
            );
            return MessageDAO.messageFromRow(result.rows[0]);
        } catch (err) {
            console.error("HIBA (MessageDAO.getMessageById):", err);
            throw err;
        }
    };

    /**
     * Törli az üzenetet a message_id alapján.
     *
     * @param {number} message_id - Az üzenet azonosítója.
     * @returns {Promise<void>} Az üzenet törlése az adatbázisból.
     * @throws {Error} Ha hiba történik az adatbázis lekérdezés során.
     */
    static async deleteMessageById(message_id) {
        try {
            await database.query(
                `DELETE FROM Messages WHERE id = $1`,
                [message_id]
            );
        } catch (err) {
            console.error("HIBA (MessageDAO.deleteMessageById):", err);
            throw err;
        }
    };

    /**
     * Frissíti az üzenet szövegét a message_id alapján.
     *
     * @param {number} message_id - Az üzenet azonosítója.
     * @param {string} text - Az új üzenet szövege.
     * @returns {Promise<void>} Az üzenet frissítése az adatbázisban.
     * @throws {Error} Ha hiba történik az adatbázis lekérdezés során.
     */
    static async updateMessageById(message_id, text) {
        try {
            await database.query(
                `UPDATE Messages SET text = $2 WHERE id = $1`,
                [message_id, text]
            );
        } catch (err) {
            console.error("HIBA (MessageDAO.updateMessageById):", err);
            throw err;
        }
    };

    /**
     * Visszaadja a chat_id-hez tartozó unread üzeneteket.
     *
     * @param {number} chat_id - A chat azonosítója.
     * @param {number} user_id - A felhasználó azonosítója, aki nem küldte az üzeneteket.
     * @returns {Promise<Message[]>} - Az olvasatlan üzenetek listája a megadott chat azonosítóhoz.
     * @throws {Error} - Ha hiba történik az adatbázis lekérdezés során.
     */
    static async getUnreadMessagesByChatId(chat_id, user_id) {
        try {
            const result = await database.query(
                `SELECT * FROM Messages
                 WHERE chat_id = $1 AND sender_id != $2 AND read = false`,
                [chat_id, user_id]
            );
            return result.rows.map(row => MessageDAO.messageFromRow(row));
        } catch (err) {
            console.error("HIBA (MessageDAO.getUnreadMessagesByChatId):", err);
            throw err;
        }
    };

    /**
     * Visszaadja az összes olvasatlan üzenetet a user-nek,
     * csak azokból a chatek-ből, amelyekben a user is benne van.
     *
     * @param {number} user_id - A felhasználó azonosítója.
     * @returns {Promise<Message[]>} - Az összes olvasatlan üzenet listája.
     * @throws {Error} - Ha hiba történik az adatbázis lekérdezés során.
     */
    static async getAllUnreadMessagesByUserId(user_id) {
        try {
            const result = await database.query(
                `SELECT * FROM Messages
             WHERE read = false
               AND sender_id != $1
               AND chat_id IN (
                   SELECT chatroom_id
                   FROM Chatroom_users
                   WHERE user_id = $1
               )`,
                [user_id]
            );
            return result.rows.map(row => MessageDAO.messageFromRow(row));
        } catch (err) {
            console.error("HIBA (MessageDAO.getAllUnreadMessagesByUserId):", err);
            throw err;
        }
    };

    /**
     * Az üzenet olvasotnak jelölése a message_id alapján.
     *
     * @param {number} message_id - Az üzenet azonosítója.
     * @returns {Promise<void>} Az üzenet olvasottsági státuszának frissítése az adatbázisban.
     * @throws {Error} Ha hiba történik az adatbázis lekérdezés során.
     */
    static async readMessage(message_id) {
        try {
            await database.query(
                `UPDATE Messages SET read = true WHERE id = $1`,
                [message_id]
            );
        } catch (err) {
            console.error("HIBA (MessageDAO.readMessage):", err);
            throw err;
        }
    }

    /**
     * Üzenet modell objektumot hoz létre az adatbázisból kapott sor alapján.
     *
     * @param {Object} row - Az adatbázis sor, amit konvertálni kell.
     * @param {number} row.id - Az üzenet azonosítója.
     * @param {string} row.text - Az üzenet szöveges tartalma.
     * @param {string} row.attachment - Az üzenethez kapcsolódó csatolmány.
     * @param {number} row.sender_id - A küldő azonosítója.
     * @param {number} row.chat_id - A chat azonosítója.
     * @param {Date} row.date - Az üzenet küldésének dátuma.
     * @param {boolean} row.read - Az üzenet olvasottsági státusza.
     * @returns {Message|null} A létrehozott Message objektum az adatbázis sorból, vagy null, ha a sor hamis értékű.
     */
    static messageFromRow(row) {
        if (!row) return null;
        return new Message(
            row.id,
            row.text,
            row.attachment,
            row.sender_id,
            row.chat_id,
            row.date,
            row.read
        );
    }
}

module.exports = MessageDAO;