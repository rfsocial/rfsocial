const express = require('express');
const router = express.Router();
const friendsController = require('../controllers/friendsController');
const authMiddleware = require('../middleware/authMiddleware');

// api/friends/add/userId
router.post('/add', authMiddleware(), friendsController.addFriend);
router.post('/confirm/:id', authMiddleware(), friendsController.friendConfirm);
router.delete('/remove', authMiddleware(), friendsController.removeFriend);
router.get('/list/:id', authMiddleware(), friendsController.listFriends);
router.get('/:id', authMiddleware(), friendsController.getFriend);

module.exports = router;