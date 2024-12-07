const database = require('../config/db');
const User = require('../models/User');

/**
 * Az adatbázisban tárolt Felhasználó objektumok kezelésére létrehozott osztály.
 */
class UserDAO {

    /** Felhasználó létrehozása az adatbázisban.
        @param {string} name - felhasználó neve
        @param {string} email - felhasználó email címe (opcionális)
        @param {string} pass - felhasználó jelszava (hashelve kell hogy érkezzen)
        @returns {User} - létrehozott felhasználó
     */
    static async create(name, email, pass) {
        try {
            const query = `
                INSERT INTO Users(username, email, password, profile_picture, date_of_birth)
                VALUES ($1, $2, $3, $4, $5) RETURNING *
            `;
            const values = [name, email, pass, '../../images/pfp-placeholder.png', new Date()];
            const result = await database.query(query, values);
            const row = result.rows[0];
            return this.userFromRow(row);
        } catch(error) {
            console.log(`Adatbázis-hiba: ${error}`);
            throw new Error(error);
        }
    }

    /** Felhasználó lekérése az adatbázisból ID alapján.
     @param {number} id - felhasználó ID
     @returns {User} - lekérdezett felhasználó
     */
    static async getUserById(id) {
        try {
            const query = `SELECT * FROM Users WHERE id = $1`;
            const result = await database.query(query, [id]);
            if(result) {
                const row = result.rows[0];
                return this.userFromRow(row);
            }
            return null;
        } catch(error) {
            console.log(`Adatbázis-hiba: ${error}`);
            throw new Error(error);
        }
    }

    /** Felhasználó lekérése az adatbázisból név alapján.
     @param {string} name - felhasználó neve
     @returns {User} - lekérdezett felhasználó
     */
    static async getUserByName(name) {
        try {
            const query = `SELECT * FROM Users WHERE username = $1`;
            const result = await database.query(query, [name]);
            if(result.rowCount > 0) {
                const row = result.rows[0];
                return this.userFromRow(row);
            }
            return null;
        } catch(error) {
            console.log(`Adatbázis-hiba: ${error}`);
            throw new Error(error);
        }
    }

    /**
     * Több felhasználó lekérése ID alapján.
     * @param {number[]} id - felhasználók ID-jei
     * @returns {Promise<void>} - a felhasználók
     */
    static async getUsersByIDs(id) {
        try {
            const query = `SELECT id, username FROM Users WHERE id = ANY($1::int[])`;
            const result = await database.query(query, [id]);
            return result.rows;
        } catch (err) {
            console.log("HIBA (UserDAO.getUsersByIDs): ", err);
            throw new Error(err);
        }
    }

    /** Felhasználó profilképének lekérése az adatbázisból ID alapján.
     @param {number} userId - felhasználó id-je
     @returns {string} - profilkép elérése
     */
    static async getUserProfilePicture(userId) {
        try {
            const query = `SELECT profile_picture FROM Users WHERE id = $1`;
            const result = await database.query(query, [userId]);
            if(result.rowCount > 0) {
                const row = result.rows[0];
                return row.profilkep;
            }
            return null;
        } catch(error) {
            console.log(`Adatbázis-hiba: ${error}`);
            throw new Error(error);
        }
    }

    /** Felhasználó törlése az adatbázisból ID alapján.
     @param {number} id - felhasználó ID
     @returns {boolean} - sikeres törlés esetén true egyébként false
     */
    static async deleteUserById(id) {
        try {
            const query = `DELETE FROM Users WHERE id = $1`;
            const result = await database.query(query, [id]);
            return result.rowCount > 0;
        } catch(error) {
            console.log(`Adatbázis-hiba: ${error}`);
            throw new Error(error);
        }
    }

    /** Felhasználó törlése az adatbázisból név alapján.
     @param {string} nev - felhasználó neve
     @returns {boolean} - sikeres törlés esetén true egyébként false
     */
    static async deleteUserByName(nev) {
        try {
            const query = `DELETE FROM Users WHERE username = $1`;
            const result = await database.query(query, [nev]);
            return result.rowCount > 0;
        } catch(error) {
            console.log(`Adatbázis-hiba: ${error}`);
            throw new Error(error);
        }
    }

    /** Felhasználó adatainak frissítése az adatbázisban ID alapján.
     @param {number} id - felhasználó ID
     @param {string} profilepic - felhasználó profilképének URL-je
     @param {string} name - felhasználó neve
     @param {string} intro - felhasználó bemutatkozó szövege
     @param {string} DOB - felhasználó születési dátuma
     @param {string} pass - felhasználó jelszava (hashelve kell hogy érkezzen)
     @param {boolean} isPublic - felhasználó profiljának láthatósága (true - nyilvános | false - privát)
     @returns {User} - a módosított felhasználó
     */
    static async updateUserById(
        id,
        profilepic,
        name,
        intro,
        DOB,
        pass,
        isPublic
    ) {
        try {
            const query = `
            UPDATE Users
            SET profile_picture = $2, 
            username = $3, 
            introduction = $4, 
            date_of_birth = $5, 
            password = $6, 
            profile_public = $7
            WHERE id = $1
            RETURNING *
        `;
            const values = [id, profilepic, name, intro, DOB, pass, isPublic];
            const result = await database.query(query, values);
            if(result.rowCount > 0) {
                const row = result.rows[0];
                return this.userFromRow(row);
            }
            return null;
        } catch(error) {
            console.log(`Adatbázis-hiba: ${error}`);
            throw new Error(error);
        }
    }

    /**
     * Moderátor jogosultság hozzáadása.
     * @param id - a felhasználó azonosítója
     */
    static async setModerator(id) {
        if (await this.isModerator(id)) {
            return;
        }

        const query = `UPDATE Users SET moderator = true WHERE id = $1`;
        try {
            await database.query(query, [id]);
            console.log("set moderator");
        } catch (err) {
            console.error("HIBA: (set moderator): ", err);
        }
    }


    /**
     * Moderátor jogosultság ellenőrzése.
     * @param id - a felhasználó azonosítója
     * @returns {Promise<boolean>} - true, ha a felhasználó moderátor, egyébként false
     */
    static async isModerator(id) {
        const query = `SELECT moderator FROM Users WHERE id = $1`;
        const result = await database.query(query, [id]);
        return result.rows[0]?.moderator || false;
    }

    /**
     * Utoljára elmentett elérhetőségi státusz frissítése
     * @param id - a felhasználó azonosítója
     * @returns {Promise<boolean>} - sikerült-e frissíteni a státuszt
     */
    static async updateLastOnlineStatus(id) {
        try {
            const query = `
                UPDATE Users
                SET last_online = NOW()
                WHERE id = $1;
            `;
            const result = await database.query(query, [id]);
            return result.rowCount > 0;

        }
        catch (err) {
            console.log(`Adatbázis-hiba: ${err}`);
            throw new Error(err);
        }
    }

    /**
     * Utoljára elmentett elérhetőségi státusz lekérése
     * @param id - a felhasználó azonosítója
     * @returns {Promise<Date>} - az elmentett elérhetőségi státusz
     */
    static async getUserLastOnlineStatusById(id) {
        try {
            const query = `
                SELECT last_online
                FROM Users
                WHERE id = $1
            `;
            const result =  await database.query(query, [id]);
            return result.rows[0]?.last_online || undefined;
        }
        catch (err) {
            console.log(`Adatbázis-hiba: ${err}`);
            throw new Error(err);
        }
    }

    /**
     * Ellenőrzi ha a felhasználó már valaha bejelentkezett
     * @param id - a felhasználó azonosítója
     * @returns {Promise<boolean>} - bejelentkezett-e már a felhasználó legalább 1x
     */
    static async hasEverLoggedIn(id) {
        try {
            const query = `SELECT last_online FROM Users WHERE id = $1`;
            const result = await database.query(query, [id]);
            return result.rows[0]?.last_online === null || result.rows[0]?.last_online === undefined;
        } catch (err) {
            console.log(`Adatbázis-hiba: ${err}`);
            throw new Error(err);
        }
    }

    /**
     * @typedef {Object} UserRow
     * @property {number} id - A felhasználó azonosítója.
     * @property {string} password - A felhasználó jelszava.
     * @property {string} username - A felhasználó neve.
     * @property {string} email - A felhasználó email címe.
     * @property {string} profile_picture - A felhasználó profilképének URL-je.
     * @property {Date} registration_timestamp - A regisztráció időpontja.
     * @property {string} introduction - A felhasználó bemutatkozó szövege.
     * @property {Date} last_online - Az utolsó belépés időpontja.
     * @property {boolean} profile_public - A profil láthatósága.
     * @property {Date} date_of_birth - A felhasználó születési dátuma
     */

    /** Segéd metódus, melynek célja egy Felhasználó példány létrehozása egy adatbázis rekord alapján. Ismétlések és a konstruktor helytelen inicializálásának elkerülése miatt lett létrehozva.
     @param {UserRow} row - felhasználó adatai
     @returns {User} - a rekord (row) alapján létrehozott példány
     */
    static userFromRow(row) {
        if(!row) return null;
        return new User(
            row.id,
            row.password,
            row.username,
            row.email,
            row.profile_picture,
            row.registration_timestamp,
            row.introduction,
            row.last_online,
            row.profile_public,
            row.date_of_birth,
            row.moderator
        );
    }
}

module.exports = UserDAO;