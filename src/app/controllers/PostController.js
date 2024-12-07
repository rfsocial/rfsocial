const postDAO = require('../dao/PostDAO');
const userDAO = require('../dao/UserDAO');
const friendsDao = require('../dao/FriendsDAO');
const DateConverter = require('../constants/DateConverter');
const NotificationService = require("../services/NotificationService");
const NotificationInteraction = require("../constants/NotificationInteraction");
const NotificationDAO = require('../dao/NotificationDAO'); // <--- Importáljuk

// Bejegyzés létrehozása
const createPost = async (req, res) => {
    const { content } = req.body;
    const userId = req.user.id; // Csak a felhasználó azonosítóját használjuk, nem a teljes objektumot

    try {
        const newPost = await postDAO.createPost(userId, content);
        await sendNotifOfPost(userId, newPost.id);
        res.status(201).json({ message: 'Bejegyzés létrehozva', post: newPost });
    } catch (error) {
        console.error('Hiba a bejegyzés létrehozása során:', error);
        res.status(500).json({ message: 'Hiba történt a bejegyzés létrehozása során!', error });
    }
};

async function sendNotifOfPost(userId, postId) {
    try {
        let friends = await friendsDao.listFriends(userId);
        let poster = await userDAO.getUserById(userId);

        let users = await Promise.all(
            friends.map(friend => userDAO.getUserById(friend.ordered_friend_id))
        );
        await Promise.all(
            users.map(user =>
                NotificationService.pushNotification(
                    user.id,
                    "Új bejegyzés érkezett!",
                    `${poster.username} új bejegyzést hozott létre!`,
                    NotificationInteraction.VIEW,
                    postId,
                    "/images/warning.png"
                )
            )
        );
    } catch (error) {
        console.log("Error sending notifications:", error);
    }
}

// Összes bejegyzés lekérése
const getAllPosts = async (req, res) => {
    try {
        const posts = await postDAO.getAllPosts();
        await Promise.all(posts.map(async post => {
            post.comments = await postDAO.getComments(post.id) || [];
            post.reactions = await postDAO.getReactions(post.id) || [];
            post.user = await userDAO.getUserById(post.user_id);
        }));
        res.render('../layouts/posts-layout', { posts: posts, isBackNeeded: false });
    } catch (error) {
        res.status(500).json({ message: 'Hiba történt a bejegyzések lekérése során!', error });
    }
};

const getPostsByUserId = async (req, res) => {
    const { userId } = req.params;
    if(userId !== null) {
        try {
            const posts = await postDAO.getUserPostsById(userId);
            await Promise.all(posts.map(async post => {
                post.comments = await postDAO.getComments(post.id) || [];
                post.reactions = await postDAO.getReactions(post.id) || [];
                post.user = await userDAO.getUserById(post.user_id);
            }));
            res.render('../layouts/posts-layout', { posts: posts, isBackNeeded: true });
        } catch(error) {
            console.log(error);
            res.status(500).json({ message: 'Hiba történt a bejegyzések lekérése során!', error });
        }
    } else {
        res.status(500).json({message: 'Hiba történt a bejegyzések lekérése során! (Rossz ID!)'});
    }
}

const getPostById = async (req, res) => {
    const { postId } = req.params;
    try {
        const post = await postDAO.getPostById(postId);
        post.comments = await postDAO.getComments(postId) || [];
        post.reactions = await postDAO.getReactions(postId) || [];
        post.user = await userDAO.getUserById(post.user_id);
        res.render('../pages/post-template', { posts: [post], isBackNeeded: true });
    } catch(error) {
        console.log(error);
        res.status(500).json({ message: 'Hiba történt a bejegyzés lekérése során!', error });
    }
}

// Komment hozzáadása egy bejegyzéshez
const addComment = async (req, res) => {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.user ? req.user.id : 1;
    try {
        const newComment = await postDAO.addComment(postId, userId, content);

        // Szerezzük meg a bejegyzést, hogy megtudjuk ki a tulajdonosa
        const post = await postDAO.getPostById(postId);

        // Ha nincs post vagy a post user_id megegyezik a userId-vel, nem küldünk értesítést
        if (post && post.user_id !== userId) {
            // Értesítés létrehozása a bejegyzés tulajdonosának
            await NotificationDAO.create(
                "Új hozzászólás",
                "Valaki hozzászólt a bejegyzésedhez",
                post.user_id,                      // Bejegyzés tulajdonosa
                NotificationInteraction.VIEW, // vagy definiálhatsz új típust a komment értesítéseknek
                postId,
                'images/warning.png' // opcionálisan adhatsz meg képet, pl. a kommentelő profilképét
            );

            // Ha szeretnéd valós időben pusholni az értesítést (feltételezve, hogy NotificationService és socket.io használatban van):
            /*
            NotificationService.pushNotification(
                post.user_id,
                "Új hozzászólás",
                "Valaki hozzászólt a bejegyzésedhez",
                NotificationInteraction.UNDEFINED,
                postId,
                null
            );
            */
        }

        res.status(201).json({ message: 'Hozzászólás hozzáadva', comment: newComment });
    } catch (error) {
        console.error('Hiba történt a hozzászólás hozzáadása során!', error);
        res.status(500).json({ message: 'Hiba történt a hozzászólás hozzáadása során!', error });
    }
};

// Reakció hozzáadása egy bejegyzéshez
const addReaction = async (req, res) => {
    const { postId } = req.params;
    const { reactionType } = req.body;
    const userId = req.user.id;
    try {
        const reaction = await postDAO.addReaction(postId, userId, reactionType);
        res.status(201).json({ message: 'Reakció hozzáadva', reaction });
    } catch (error) {
        res.status(500).json({ message: 'Hiba történt a reakció hozzáadása során!', error });
    }
};

// Kommentek lekérése egy adott bejegyzéshez
const getComments = async (req, res) => {
    const { postId } = req.params;
    try {
        const comments = await postDAO.getComments(postId);
        await Promise.all(comments.map(async comment => {
            comment.relativeDate = DateConverter.convertDateToRelativeTime(comment.created_at);
            comment.user = await userDAO.getUserById(comment.user_id);
        }));
        res.render('../partials/comment-template', { postId, comments });
    } catch (error) {
        res.status(500).json({ message: 'Hiba történt a kommentek lekérése során!', error });
    }
};

// Reakciók lekérése egy adott bejegyzéshez
const getReactions = async (req, res) => {
    const { postId } = req.params;
    try {
        const reactions = await postDAO.getReactions(postId);
        res.status(200).json(reactions);
    } catch (error) {
        res.status(500).json({ message: 'Hiba történt a reakciók lekérése során!', error });
    }
};
// Like hozzáadása
const addLike = async (req, res) => {
    const { postId } = req.params;
    const userId = req.user.id;
    try {
        const result = await postDAO.addReaction(postId, userId, 'like');

        if (result.message === 'Reakció törölve') {
            return res.status(200).json({ message: 'A like sikeresen törölve.' });
        } else if (result.type === 'like') {
            return res.status(200).json({ message: 'Like sikeresen hozzáadva.', reaction: result });
        }
    } catch (error) {
        console.error('Hiba történt a like kezelés során:', error);
        res.status(500).json({ message: 'Hiba történt a like kezelés során!', error });
    }
};

// Dislike hozzáadása
const addDislike = async (req, res) => {
    const { postId } = req.params;
    const userId = req.user.id;
    try {
        const result = await postDAO.addReaction(postId, userId, 'dislike');

        if (result.message === 'Reakció törölve') {
            return res.status(200).json({ message: 'A dislike sikeresen törölve.' });
        } else if (result.type === 'dislike') {
            return res.status(200).json({ message: 'Dislike sikeresen hozzáadva.', reaction: result });
        }
    } catch (error) {
        console.error('Hiba történt a dislike kezelés során:', error);
        res.status(500).json({ message: 'Hiba történt a dislike kezelés során!', error });
    }
};
const deletePost = async (req, res) => {
    const { postId } = req.params; // A bejegyzés azonosítója
    const userId = req.user.id; // A bejelentkezett felhasználó azonosítója

    try {
        // Meghívjuk a DAO-t a törléshez
        const result = await postDAO.deletePost(postId, userId);

        // Ellenőrizzük a törlés eredményét
        if (result.success) {
            return res.status(200).json({ message: result.message });
        } else {
            return res.status(403).json({ message: result.message }); // Ha nem saját bejegyzés
        }
    } catch (error) {
        console.error('Hiba történt a bejegyzés törlése során:', error);
        res.status(500).json({ message: 'Hiba történt a bejegyzés törlése során!', error });
    }
};
const updatePost = async (req, res) => {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.user.id; // A user ID az authMiddleware-ből érkezik

    if (!content || content.trim() === '') {
        return res.status(400).json({ message: 'A tartalom nem lehet üres!' });
    }

    try {
        const result = await postDAO.updatePost(postId, userId, content);

        if (result.success) {
            return res.status(200).json({ message: result.message });
        } else {
            return res.status(403).json({ message: result.message }); // Ha a bejegyzés nem a felhasználóé
        }
    } catch (error) {
        console.error('Hiba a bejegyzés frissítése során:', error);
        return res.status(500).json({ message: 'Hiba történt a bejegyzés frissítése során!', error });
    }
};

const deleteComment = async (req, res) => {
    const { postId, commentId } = req.params;
    const userId = req.user.id;

    try {
        const result = await postDAO.deleteComment(postId, commentId, userId);

        if (result.success) {
            return res.status(200).json({ message: result.message });
        } else {
            return res.status(403).json({ message: result.message });
        }
    } catch (error) {
        console.error('Hiba a komment törlése során:', error);
        res.status(500).json({ message: 'Hiba történt a komment törlése során!', error });
    }
};
const editComment = async (req, res) => {
    const { postId, commentId } = req.params;
    const { content } = req.body;
    const userId = req.user.id; // AuthMiddleware biztosítja

    if (!content || content.trim() === '') {
        return res.status(400).json({ message: 'A tartalom nem lehet üres!' });
    }

    try {
        const result = await postDAO.editComment(postId, commentId, userId, content);

        if (result.success) {
            return res.status(200).json({
                message: result.message,
                updatedComment: { id: commentId, content }
            });
        } else {
            return res.status(403).json({ message: result.message }); // Ha nem saját komment
        }
    } catch (error) {
        console.error('Hiba a komment frissítése során:', error);
        return res.status(500).json({ message: 'Hiba történt a komment frissítése során!', error });
    }
};



module.exports = { createPost, getAllPosts, getPostsByUserId, getPostById, addComment, addReaction, getComments, getReactions, addLike, addDislike,deletePost,updatePost,deleteComment,editComment, };




