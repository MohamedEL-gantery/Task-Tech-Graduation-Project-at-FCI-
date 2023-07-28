const express = require('express');
const messageController = require('../Controllers/messageController');
const authController = require('../Controllers/authController');

const router = express.Router();

router.use(authController.protect, authController.restrictTo('user', 'admin'));

router.post('/', messageController.addMessage);

router.get('/:chatId', messageController.getMessages);

module.exports = router;
