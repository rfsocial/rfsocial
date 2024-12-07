const database = require('../config/db');
const Report = require('../models/Report');
const UserDAO = require('./UserDAO');

/**
 * Az adatbázisban tárolt Bejelentés objektumok kezelésére létrehozott osztály.
 */
class ReportDAO {

    /** Bejelentés létrehozása az adatbázisban.
     @param {number} userId - A bejelentő id-je.
     @param {string} description - Az bejelentés szövege.
     @param {string} attachedTo - A bejelentés bejegyzéshez vagy hozzászóláshoz tartozása ("post" vagy "comment" értéke lehet csak)
     @param {number} attachmentId - A bejegyzés/hozzászólás id-je, mely a bejelentéshez tartozik.
     @returns {Report} - létrehozott bejelentés
     */
    static async create(
        userId,
        description,
        attachedTo,
        attachmentId
    ) {
        try {
            let postId, commentId;
            if(attachedTo === "post") {
                postId = attachmentId;
                commentId = null;
            } else if(attachedTo === "comment") {
                postId = null;
                commentId = attachmentId;
            }
            const query = `
                INSERT INTO Report(user_id, text, post_id, comment_id)
                VALUES ($1, $2, $3, $4) RETURNING *
            `;
            const values = [userId, description, postId, commentId];
            const result = await database.query(query, values);
            const row = result.rows[0];
            return this.reportFromRow(row);
        } catch(error) {
            console.log(`Adatbázis-hiba: ${error}`);
            throw new Error(error);
        }
    }

    /** Bejelentés állapotának frissítése az adatbázisban.
     @param {number} reportId - Az bejelentés id-je.
     @param {boolean} state - A bejegyzés új állapota (true ha elfogadott - false ha elutasított).
     @returns {boolean} - Módosított bejelentés
     */
    static async updateReportState(reportId, state) {
        try {
            const query = `UPDATE Report SET status = $1 WHERE id = $2 RETURNING *`;
            const values = [state, reportId];
            const result = await database.query(query, values);
            if(result.rowCount > 0) {
                const row = result.rows[0];
                return this.reportFromRow(row);
            }
            return null;
        } catch(error) {
            console.log(`Adatbázis-hiba: ${error}`);
            throw new Error(error);
        }
    }

    /** Összes bejelentés lekérése az adatbázisból.
     @returns {Array<Report>} - bejelentések
     */
    static async getAllReports() {
        try {
            const query = `SELECT * FROM Report`;
            const result = await database.query(query);
            if(result && result.rows.length > 0) {
                return result.rows.map(row => this.reportFromRow(row)); // a bejelentés rekordokat Array<Report>-ra alakítja
            }
            return [];

        } catch(error) {
            console.log(`Adatbázis-hiba: ${error}`);
            throw new Error(error);
        }
    }

    /** Adott bejelentés lekérdezése az adatbázisból ID alapján.
     @param {number} reportId - Az értesítés id-je.
     @returns {Report} - lekérdezett bejelentés
     */
    static async getReportById(reportId) {
        try {
            const query = `SELECT * FROM Report WHERE id = $1`;
            const result = await database.query(query, [reportId]);
            if(result) {
                const row = result.rows[0];
                return this.reportFromRow(row);
            }
            return null;
        } catch(error) {
            console.log(`Adatbázis-hiba: ${error}`);
            throw new Error(error);
        }
    }

    /** Adott bejelentés törlése az adatbázisból ID alapján.
     @param {number} reportId - Az értesítés id-je.
     @returns {boolean} - sikeres törlés esetén true egyébként false
     */
    static async deleteReportById(reportId) {
        try {
            const query = `DELETE FROM Report WHERE id = $1`;
            const result = await database.query(query, [reportId]);
            return result.rowCount > 0;
        } catch(error) {
            console.log(`Adatbázis-hiba: ${error}`);
            throw new Error(error);
        }
    }

    /**
     * @typedef {Object} ReportRow
     * @property {string} id - Az bejelentés id-je.
     * @property {string} text - A bejelentés szövege.
     * @property {boolean} status - Az bejelentés státusza (true ha elfogadott - false ha elutasított).
     * @property {string} user_id - A bejelentő id-je.
     * @property {string} post_id - Ha a bejelentés bejegyzéshez tartozik akkor ez az érték nem NULL, a bejegyzés id-jét tartalmazza
     * @property {string} comment_id - Ha a bejelentés hozzászóláshoz tartozik akkor ez az érték nem NULL, a hozzászólás id-jét tartalmazza
     */

    /** Segéd metódus, melynek célja egy Bejelentés példány létrehozása egy adatbázis rekord alapján. Ismétlések és a konstruktor helytelen inicializálásának elkerülése miatt lett létrehozva.
     @param {ReportRow} row - bejelentés adatai
     @returns {Report} - a rekord (row) alapján létrehozott példány
     */
    static reportFromRow(row) {
        if(!row) return null;
        const profilkepUrl = UserDAO.getUserProfilePicture(row.felhasznalo_id);
        return new Report(
            row.id,
            row.text,
            row.status,
            row.user_id,
            row.post_id,
            row.comment_id,
            profilkepUrl
        )
    }
}

module.exports = ReportDAO;