const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const NotificationController = require('../controllers/notificationController');

router.get('/', authMiddleware(), NotificationController.getUserNotifications);
router.get('/push-unread', authMiddleware(), NotificationController.pushUnreadNotifications);
router.put('/:id/read', authMiddleware(), NotificationController.setNotificationRead);
router.delete('/:id', authMiddleware(), NotificationController.removeNotification);
router.post('/:id/interaction', authMiddleware(), NotificationController.handleNotificationInteraction); // id nem biztos hogy kell itt

module.exports = router;