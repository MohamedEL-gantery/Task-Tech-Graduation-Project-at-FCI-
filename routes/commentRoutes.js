const express = require('express');
const commentController = require('../Controllers/commentController');
const authController = require('../Controllers/authController');

const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router
  .route('/')
  .get(commentController.getAllComments)
  .post(authController.restrictTo('user'), commentController.createComment);

router
  .route('/:id')
  .get(commentController.getComment)
  .patch(
    authController.restrictTo('user', 'admin'),
    commentController.updateComment
  )
  .delete(
    authController.restrictTo('user', 'admin'),
    commentController.deleteComment
  );
module.exports = router;
