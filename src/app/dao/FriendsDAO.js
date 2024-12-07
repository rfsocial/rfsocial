const database = require('../config/db');
const User = require('../models/User');


class FriendsDAO {
    /** Ismerős hozzáadása adott felhasználóhoz. Azaz rekord hozzáadása az Ismerősök táblába.
     @param {number} userId - az első felhasználó id-je
     @param {number} friendId - a második felhasználó id-je
     @returns Promise<boolean> - a hozzáadás sikeressége (true: sikeres ; false: sikertelen)
     */
    static async addFriend(userId, friendId) {
        try {
            if (userId === friendId) return false;

            const query = `INSERT INTO friends(user_id, friend_id) VALUES($1, $2)`;
            const values = [userId, friendId];
            const result = await database.query(query, values);
            return result.rowCount > 0;
        } catch (error) {
            console.log(`Adatbázis-hiba: ${error}`);
            throw new Error(error);
        }
    }

    /** Adott felhasználó ismerősének törlése. Azaz rekord törlése az Ismerősök táblából. TODO jobb dokumentáció XDXDXD
     @param {number} userId - az első felhasználó id-je
     @param {number} friendId - a második felhasználó id-je
     @returns Promise<boolean> - a törlés sikeressége (true: sikeres ; false: sikertelen)
     */
    static async removeFriend(userId, friendId) {
        try {
            if (userId === friendId) return false;

            const query = `
                DELETE FROM friends
                WHERE (user_id = $1 AND friend_id = $2)
                   OR (user_id = $2 AND friend_id = $1)
            `;
            const values = [userId, friendId];
            const result = await database.query(query, values);
            return result.rowCount > 0;
        } catch (error) {
            console.log(`Adatbázis-hiba: ${error}`);
            throw new Error(error);
        }
    }

    /**
     * Ismerős kérés elfogadása.
     * @param {number} userId - a felhasználó id-je
     * @param {number} friendId - a másoik felhasználó id-je
     * @returns Promise<boolean> - a művelet sikeressége
     */
    static async friendConfirm(userId, friendId) {
        try {
            const query = `UPDATE friends SET status = $3 WHERE user_id = $1 AND friend_id = $2`;
            const values = [userId, friendId, 'accepted'];
            const result = await database.query(query, values);
            return result.rowCount > 0;
        } catch (err) {
            console.error('HIBA (FriendsDAO.friendConfirm):', err);
            return false;
        }
    }

    /** A felhasználó ismerőseinek visszaadása.
     @param {number} userId - a felhasználó id-je
     @returns Promise<number[]> - a felhasználó barátai id-jeinek tömbje
     */
    static async listFriends(userId) {
        try {
            //SELECT ordered_friend_id FROM Friends WHERE ordered_user_id = $1
            const query = `SELECT CASE WHEN user_id = $1 THEN friend_id 
                            ELSE user_id END AS ordered_friend_id FROM Friends
                           WHERE (user_id = $1 OR friend_id = $1) AND status = 'accepted'`;
            const user_id = [userId];
            const result = await database.query(query, user_id);
            return result.rows;
        } catch (error) {
            console.log(`Adatbázis-hiba: ${error}`);
            throw new Error(error);
        }
    }

    static async getFriend(userId, friendId) {
        try {
            // A queryben castolni kell int-re, hiába van konverzió js-en belül, csak így működik valamiért
            const query = `
                SELECT * FROM Friends
                WHERE ordered_user_id = LEAST(CAST($1 AS INT), CAST($2 AS INT)) 
                AND ordered_friend_id = GREATEST(CAST($1 AS INT), CAST($2 AS INT));
            `;
            const values = [userId, friendId];
            const result = await database.query(query, values);
            return result.rows[0];
        } catch (err) {
            console.error("HIBA (FriendsDAO.getFriend):", err);
            return null;
        }
    }
}

module.exports = FriendsDAO;