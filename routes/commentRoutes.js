const express = require('express');
const commentController = require('../Controllers/commentController');
const authController = require('../Controllers/authController');

const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router
  .route('/')
  .get(commentController.getAllComments)
  .post(authController.restrictTo('user'), commentController.createComment);

router.get('/:id', commentController.getComment);

router.use(authController.restrictTo('user', 'admin'));

router
  .route('/:id')
  .patch(commentController.isOwner, commentController.updateComment)
  .delete(commentController.isOwner, commentController.deleteComment);
module.exports = router;
