const database = require('../config/db');
const Post = require("../models/Post");

class PostDAO {
    // Bejegyzés létrehozása
    static async createPost(userId, content) {
        const query = `
            INSERT INTO Post (user_id, content, created_at)
            VALUES ($1, $2, NOW())
            RETURNING *;
        `;
        const values = [userId, content];
        const result = await database.query(query, values);
        return result.rows[0];
    }

    // Összes bejegyzés lekérése
    static async getAllPosts() {
        const query = `
            SELECT p.*, u.username AS username
            FROM Post p
            JOIN users u ON p.user_id = u.id
            ORDER BY p.created_at DESC;
        `;
        const result = await database.query(query);
        return result.rows;
    }

    // Komment hozzáadása egy bejegyzéshez
    static async addComment(postId, userId, content) {
        const query = `
            INSERT INTO Comment (post_id, user_id, content, created_at)
            VALUES ($1, $2, $3, NOW())
            RETURNING *;
        `;
        const values = [postId, userId, content];
        const result = await database.query(query, values);
        return result.rows[0];
    }

    // Reakció hozzáadása egy bejegyzéshez
    static async addReaction(postId, userId, reactionType) {
        const selectQuery = `
        SELECT * FROM Reaction WHERE post_id = $1 AND user_id = $2;
    `;
        const selectValues = [postId, userId];
        const selectResult = await database.query(selectQuery, selectValues);

        if (selectResult.rows.length > 0) {
            const existingReaction = selectResult.rows[0];

            if (existingReaction.type === reactionType) {
                const deleteQuery = `
                DELETE FROM Reaction WHERE post_id = $1 AND user_id = $2;
            `;
                const deleteValues = [postId, userId];
                await database.query(deleteQuery, deleteValues);
                return { message: 'Reakció törölve' };
            } else {
                const updateQuery = `
                UPDATE Reaction SET type = $3 WHERE post_id = $1 AND user_id = $2 RETURNING *;
            `;
                const updateValues = [postId, userId, reactionType];
                const updateResult = await database.query(updateQuery, updateValues);
                return updateResult.rows[0];
            }
        } else {
            const insertQuery = `
            INSERT INTO Reaction (post_id, user_id, type)
            VALUES ($1, $2, $3)
            RETURNING *;
        `;
            const insertValues = [postId, userId, reactionType];
            const insertResult = await database.query(insertQuery, insertValues);
            return insertResult.rows[0];
        }
    }


    // Kommentek lekérése egy adott bejegyzéshez
    static async getComments(postId) {
        const query = `
            SELECT c.*, u.username AS username
            FROM Comment c
            JOIN users u ON c.user_id = u.id
            WHERE c.post_id = $1
            ORDER BY c.created_at DESC;
        `;
        const result = await database.query(query, [postId]);
        return result.rows;
    }

    // Reakciók lekérése egy adott bejegyzéshez
    static async getReactions(postId) {
        const query = `
            SELECT r.*, u.username AS username
            FROM Reaction r
            JOIN users u ON r.user_id = u.id
            WHERE r.post_id = $1;
        `;
        const result = await database.query(query, [postId]);
        return result.rows;
    }

    // Összes komment lekérése a rendszeren belül
    static async getAllComments() {
        const query = `
            SELECT c.*, u.username AS username
            FROM Comment c
            JOIN users u ON c.user_id = u.id
            ORDER BY c.created_at ASC;
        `;
        const result = await database.query(query);
        return result.rows;
    }

    static async getUserPostsById(userId) {
        try {
            const query = `
                SELECT p.*, u.username AS username 
                FROM Post p 
                JOIN users u ON p.user_id = u.id
                WHERE u.id = $1
                ORDER BY p.created_at DESC;
            `;
            const result = await database.query(query, [userId]);
            if(result && result.rows.length > 0) {
                return result.rows.map(row => this.postFromRow(row));
            }
            return [];
        } catch(error) {
            console.log(`Adatbázis-hiba: ${error}`);
            throw new Error(error);
        }
    }

    static async getPostById(postId) {
        try {
            const query = `
                SELECT p.*, u.username AS username
                FROM Post p
                JOIN Users u ON p.user_id = u.id
                WHERE p.id = $1
            `;
            const result = await database.query(query, [postId]);
            if(result && result.rows.length > 0) {
                return this.postFromRow(result.rows[0]);
            }
            return [];
        } catch(error) {
            console.log(`Adatbázis-hiba: ${error}`);
            throw new Error(error);
        }
    }

    static async getUserCommentCount(userId) {
        try {
            const query = `
                SELECT COUNT(*) FROM Comment WHERE user_id = $1
            `;
            const result = await database.query(query, [userId]);
            return result.rows[0].count;
        } catch(error) {
            console.log(`Adatbázis-hiba: ${error}`);
            throw new Error(error);
        }
    }

    static postFromRow(row) {
        if(!row) return null;
        return new Post(
            row.id,
            row.attachment,
            row.content,
            row.user_id,
            row.created_at,
            row.username
        );
    }
    // Bejegyzés törlése, csak ha a felhasználó saját bejegyzése
    static async deletePost(postId, userId) {
        const queryCheck = `
            SELECT user_id
            FROM Post
            WHERE id = $1;
        `;
        const result = await database.query(queryCheck, [postId]);

        if (result.rows.length === 0) {
            return { success: false, message: "Bejegyzés nem található!" };
        }

        const postOwnerId = result.rows[0].user_id;

        // Moderátori jogosultság ellenőrzése
        const isModeratorQuery = `
        SELECT moderator
        FROM Users
        WHERE id = $1;
    `;
        const moderatorResult = await database.query(isModeratorQuery, [userId]);
        const isModerator = moderatorResult.rows[0]?.moderator || false;

        if (userId !== postOwnerId && !isModerator) {
            return { success: false, message: "Nincs jogosultság a bejegyzés törléséhez!" };
        }

        const deleteQuery = `
        DELETE FROM Post
        WHERE id = $1;
    `;
        await database.query(deleteQuery, [postId]);
        return { success: true, message: "Bejegyzés sikeresen törölve!" };
    }
    static async deletePostByAdmin(postId) {
        const query = `
        DELETE FROM Post
        WHERE id = $1
        RETURNING *;
    `;
        const values = [postId];

        const result = await database.query(query, values);

        if (result.rowCount > 0) {
            return { success: true, message: 'A bejegyzés sikeresen törölve.' };
        } else {
            return { success: false, message: 'Nincs jogosultságod a bejegyzés törlésére.' };
        }
    }
    static async updatePost(postId, userId, content) {
        const query = `
        UPDATE Post
        SET content = $3
        WHERE id = $1 AND user_id = $2
        RETURNING *;
    `;
        const values = [postId, userId, content];

        try {
            const result = await database.query(query, values);

            if (result.rowCount === 0) {
                return { success: false, message: 'Nem módosíthatod ezt a bejegyzést!' };
            }

            return { success: true, message: 'Bejegyzés sikeresen frissítve.', post: result.rows[0] };
        } catch (error) {
            console.error('Adatbázis-hiba:', error);
            throw new Error('Hiba történt a bejegyzés frissítése során.');
        }
    }
    static async deleteComment(postId, commentId, userId) {
        // Komment tulajdonosának ellenőrzése
        const queryCheck = `
        SELECT user_id
        FROM Comment
        WHERE id = $1 AND post_id = $2;
    `;
        const result = await database.query(queryCheck, [commentId, postId]);

        if (result.rows.length === 0) {
            return { success: false, message: "A komment nem található!" };
        }

        const commentOwnerId = result.rows[0].user_id;

        // Moderátori jogosultság ellenőrzése
        const isModeratorQuery = `
        SELECT moderator
        FROM Users
        WHERE id = $1;
    `;
        const moderatorResult = await database.query(isModeratorQuery, [userId]);
        const isModerator = moderatorResult.rows[0]?.moderator || false;

        // Ellenőrizzük, hogy a felhasználó a komment tulajdonosa-e vagy moderátor
        if (userId !== commentOwnerId && !isModerator) {
            return { success: false, message: "Nincs jogosultság a komment törléséhez!" };
        }

        // Komment törlése
        const deleteQuery = `
        DELETE FROM Comment
        WHERE id = $1 AND post_id = $2;
    `;
        await database.query(deleteQuery, [commentId, postId]);
        return { success: true, message: "Komment sikeresen törölve!" };
    }

    static async editComment(postId, commentId, userId, content) {
        const query = `
        UPDATE Comment
        SET content = $1, created_at = NOW()
        WHERE id = $2 AND post_id = $3 AND user_id = $4
        RETURNING *;
    `;
        const values = [content, commentId, postId, userId];
        const result = await database.query(query, values);

        if (result.rowCount > 0) {
            return { success: true, comment: result.rows[0] };
        } else {
            return { success: false, message: 'Nincs jogosultság a komment szerkesztéséhez!' };
        }
    }
}

module.exports = PostDAO;






