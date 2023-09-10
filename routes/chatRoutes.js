const express = require('express');
const authController = require('../Controllers/authController');
const chatController = require('../Controllers/chatController');

const router = express.Router();

// Protect all routes after this middleware
router.use(authController.protect, authController.restrictTo('user', 'admin'));

router.route('/').post(chatController.createChat);

router.route('/:userId').get(chatController.userChats);

router.route('/find/:firstId/:secondId').get(chatController.findChat);

module.exports = router;
