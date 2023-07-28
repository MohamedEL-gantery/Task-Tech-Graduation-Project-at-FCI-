const express = require('express');
const chatController = require('../Controllers/chatController');
const authController = require('../Controllers/authController');

const router = express.Router();

router.use(authController.protect, authController.restrictTo('user', 'admin'));

router.route('/').post(chatController.createChat);

router.route('/:userId').get(chatController.userChats);

router.route('/find/:firstId/:secondId').get(chatController.findChat);

module.exports = router;
