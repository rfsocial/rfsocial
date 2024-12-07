const express = require('express');
const settingsController = require('../controllers/settingsController');
const authMiddleware = require('../middleware/authMiddleware');
const fileUploadMiddleware = require('../middleware/fileUploadMiddleware');
const profileController = require("../controllers/profileController");
const router = express.Router();

router.get('/', authMiddleware(), settingsController.getSettings);
router.put('/', authMiddleware(), settingsController.updateSettings);
//router.delete('/', authMiddleware(), profileController.deleteProfile);

module.exports = router;