const express = require('express');
const messageController = require('../Controllers/messageController');
const authController = require('../Controllers/authController');

const router = express.Router({ mergeParams: true });

router.use(authController.protect);
router.use(authController.restrictTo('user', 'admin'));

router.post(
  '/',
  authController.restrictTo('user'),
  messageController.addMessage
);

router.get('/:chatId', messageController.getMessages);

module.exports = router;
