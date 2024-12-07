const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const ReportController = require('../controllers/reportController');

router.get('/', authMiddleware("moderator"), ReportController.getAllReports);
router.put('/handle', authMiddleware("moderator"), ReportController.handleReport);
router.post('/add', authMiddleware(), ReportController.addReport);

module.exports = router;