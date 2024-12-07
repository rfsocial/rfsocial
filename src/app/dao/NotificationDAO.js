const database = require('../config/db');
const Notification = require('../models/Notification')
const NotificationInteraction = require('../constants/NotificationInteraction');
const { convertDateToRelativeTime } = require("../constants/DateConverter");

/**
 * Az adatbázisban tárolt Értesítés objektumok kezelésére létrehozott osztály.
 */
class NotificationDAO {

    /** Értesítés létrehozása az adatbázisban.
     @param {string} title - Az értesítés címe.
     @param {string} description - Az értesítés szövege.
     @param {number} userId - Az értesítéshez tartozó felhasználó id-je.
     @param {NotificationInteraction} interactionType - Az értesítés interakciójának típusa.
     @param {number} relationId - Az értesítéshez kapcsolódó hivatkozás id-je (pl. felhasználó, bejegyzés stb.)
     @param {string} imgUrl - Értesítéshez tartozó kép url-je (mutathat egy felhasználó képére vagy statikus képre is).
     @returns {Notification} - létrehozott értesítés
     */
    static async create(
        title,
        description,
        userId,
        interactionType,
        relationId,
        imgUrl
    ) {
        try {
            const query = `
                INSERT INTO Notification(title, text, user_id, interaction_type, link_id, picture_url)
                VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
            `;
            let rawInteractionType;
            switch(interactionType) {
                case NotificationInteraction.FRIEND_REQUEST:
                    rawInteractionType = 'friend-request';
                    break;
                case NotificationInteraction.VIEW:
                    rawInteractionType = 'view';
                    break;
                default:
                    rawInteractionType = '';
                    break;
            }
            const values = [title, description, userId, rawInteractionType, relationId, imgUrl];
            const result = await database.query(query, values);
            const row = result.rows[0];
            return this.notificationFromRow(row);
        } catch(error) {
            console.log(`Adatbázis-hiba: ${error}`);
            throw new Error(error);
        }
    }

    /** Felhasználóhoz tartozó értesítések lekérése id alapján.
     @param {number} userId - A felhasználó id-je.
     @returns {Array<Notification>} - Felhasználóhoz tartozó értesítések
     */
    static async getNotificationsByUserId(userId) {
        try {
            const query = `SELECT * FROM Notification WHERE user_id = $1`;
            const result = await database.query(query, [userId]);
            if(result && result.rows.length > 0) {
                return result.rows.map(row => this.notificationFromRow(row)); // az értesítés rekordokat Array<Notification>-re alakítja
            }
            return [];
        } catch(error) {
            console.log(`Adatbázis-hiba: ${error}`);
            throw new Error(error);
        }
    }

    /** Felhasználóhoz tartozó nem olvasott értesítések lekérése id alapján.
     @param {number} userId - A felhasználó id-je.
     @returns {Array<Notification>} - Felhasználóhoz tartozó értesítések
     */
    static async getUnreadNotificationsByUserId(userId) {
        try {
            const query = `SELECT * FROM Notification WHERE user_id = $1 AND read = false`;
            const result = await database.query(query, [userId]);
            if(result && result.rows.length > 0) {
                return result.rows.map(row => this.notificationFromRow(row)); // az értesítés rekordokat Array<Notification>-re alakítja
            }
            return [];
        } catch(error) {
            console.log(`Adatbázis-hiba: ${error}`);
            throw new Error(error);
        }
    }

    /** Értesítés lekérése id alapján.
     @param {number} notificationId - A felhasználó id-je.
     @returns {Notification} - lekérdezett értesítés
     */
    static async getNotificationById(notificationId) {
        try {
            const query = `SELECT * FROM Notification WHERE id = $1`;
            const result = await database.query(query, [notificationId]);
            if(result.rowCount > 0) {
                return this.notificationFromRow(result.rows[0]);
            }
            return null;
        } catch(error) {
            console.log(`Adatbázis-hiba: ${error}`);
            throw new Error(error);
        }
    }

    /** Adott értesítés olvasott értékének módosítása
     @param {number} notificationId - Az értesítés id-je.
     @param {boolean} read - Az értesítés olvasott új értéke (true: olvasott ; false: olvasatlan)
     @returns {Notification} - Módosított értesítés
     */
    static async setNotificationReadById(notificationId, read) {
        try {
            const query = `UPDATE Notification SET read = $1 WHERE id = $2 RETURNING *`;
            const values = [read, notificationId];
            const result = await database.query(query, values);
            if(result.rowCount > 0) {
                const row = result.rows[0];
                return this.notificationFromRow(row);
            }
            return null;
        } catch(error) {
            console.log(`Adatbázis-hiba: ${error}`);
            throw new Error(error);
        }
    }

    /** Adott értesítés interakcio_teljesitve értékét true-ra állítja.
     @param {number} notificationId - Az értesítés id-je.
     @returns {Notification} - Módosított értesítés
     */
    /* - Nem volt rá szükség (de azért meghagyom ki tudja)
    static async setNotificationInteractionAsCompleted(notificationId) {
        try {
            const query = `UPDATE Ertesites SET interakcio_teljesitve = true WHERE id = $1 RETURNING *`;
            const result = await database.query(query, [notificationId]);
            if(result.rowCount > 0) {
                const row = result.rows[0];
                return this.notificationFromRow(row);
            }
            return null;
        } catch(error) {
            console.log(`Adatbázis-hiba: ${error}`);
            throw new Error(error);
        }
    }*/

    /** Adott értesítés törlése az adatbázisból ID alapján.
     @param {number} notificationId - Az értesítés id-je.
     @returns Promise<boolean> - sikeres törlés esetén true egyébként false
     */
    static async deleteNotificationById(notificationId) {
        try {
            const query = `DELETE FROM Notification WHERE id = $1`;
            const result = await database.query(query, [notificationId]);
            return result.rowCount > 0;
        } catch(error) {
            console.log(`Adatbázis-hiba: ${error}`);
            throw new Error(error);
        }
    }

    /**
     * @typedef {Object} NotificationRow
     * @property {string} id - Az értesítés id-je.
     * @property {string} title - Az értesítés címe.
     * @property {string} text - Az értesítés szövege.
     * @property {boolean} read - Ha az értesítés már el van olvasva true egyébként false.
     * @property {number} user_id - Az értesítéshez tartozó felhasználó id-je.
     * @property {string} interaction_type - Az értesítéshez tartozó interakció típus. Ennek alapján fognak megjelenni különböző műveletek (pl. ismerős hozzáadás, hivatkozás megtekintés)
     * @property {number} link_id - Az értesítéshez kapcsolódó hivatkozás id-je (pl. felhasználó, bejegyzés stb.)
     * @property {Date} created_at - Az értesítés létrejöttének dátuma.
     * @property {string} picture_url - Értesítéshez tartozó kép url-je (mutathat egy felhasználó képére vagy statikus képre is).
     */

    /** Segéd metódus, melynek célja egy Értesítés példány létrehozása egy adatbázis rekord alapján. Ismétlések és a konstruktor helytelen inicializálásának elkerülése miatt és a NotificationInteraction kezelésére lett létrehozva.
     @param {NotificationRow} row - felhasználó adatai
     @returns {Notification} - a rekord (row) alapján létrehozott példány
     */
    static notificationFromRow(row) {
        if(!row) return null;
        let interactionType;
        switch(row.interaction_type) {
            case 'friend-request':
                interactionType = NotificationInteraction.FRIEND_REQUEST;
                break;
            case 'view':
                interactionType = NotificationInteraction.VIEW;
                break;
            default:
                interactionType = NotificationInteraction.UNDEFINED;
        }
        return new Notification(
            row.id,
            row.title,
            row.text,
            row.read,
            row.user_id,
            /* Itt már nem stringként hanem NotificationInteraction-ként van kezelve az interakció típus.
            Ez azért van hogy már definiált konstans értékekkel dolgozzunk és ne lehessen véletlen elírni az interakció típust pl. egy if ágban. */
            interactionType,
            row.link_id,
            row.created_at,
            row.picture_url,
            convertDateToRelativeTime(row.created_at)
        );
    }
}

module.exports = NotificationDAO;