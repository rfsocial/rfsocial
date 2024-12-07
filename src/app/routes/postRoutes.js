const express = require('express');
const router = express.Router();
const PostController = require('../controllers/PostController');
const authMiddleware = require('../middleware/authMiddleware');

// TODO: Ha nem lesz látogató akkor authMiddlewaret hozzá kell adni azokhoz ahol nincsenek

// Bejegyzés létrehozása
router.post('/', authMiddleware(), PostController.createPost);

// Összes bejegyzés lekérése
router.get('/', PostController.getAllPosts);

// Adott felhasználó bejegyzéseinek lekérése
router.get('/:userId', PostController.getPostsByUserId)

// Egy bejegyzés lekérése, pl. megtekintésre értesítésnél, nincs rá szükség egyelőre
router.get('/view/:postId', authMiddleware(), PostController.getPostById)

// Kommentek lekérése egy adott bejegyzéshez
router.get('/:postId/comments', PostController.getComments);

// Reakciók lekérése egy adott bejegyzéshez
router.get('/:postId/reactions', PostController.getReactions);

// Hozzászólás hozzáadása a bejegyzéshez
router.post('/:postId/comments', authMiddleware(), PostController.addComment);

// Reakció hozzáadása a bejegyzéshez
router.post('/:postId/reactions', authMiddleware(), PostController.addReaction);

// Like hozzáadása egy bejegyzéshez (authMiddleware hozzáadásával)
router.post('/:postId/like', authMiddleware(), PostController.addLike);

// Dislike hozzáadása egy bejegyzéshez (authMiddleware hozzáadásával)
router.post('/:postId/dislike', authMiddleware(), PostController.addDislike);

// Bejegyzés törlése
router.delete('/:postId', authMiddleware(), PostController.deletePost);

router.put('/:postId', authMiddleware(), PostController.updatePost);

// Komment törlése
router.delete('/:postId/comments/:commentId', authMiddleware(), PostController.deleteComment);

// Komment módosítása
router.put('/:postId/comments/:commentId', authMiddleware(), PostController.editComment);



module.exports = router;




