const express = require('express');
const authController = require('../Controllers/authController');
const messageController = require('../Controllers/messageController');

const router = express.Router();

// Protect all routes after this middleware
router.use(authController.protect, authController.restrictTo('user', 'admin'));

router.route('/').post(messageController.addMessage);

router.route('/:chatId').get(messageController.getMessages);

module.exports = router;
