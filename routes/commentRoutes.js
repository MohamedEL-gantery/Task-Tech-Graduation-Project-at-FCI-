const express = require('express');
const authController = require('../Controllers/authController');
const commentController = require('../Controllers/commentController');

const router = express.Router({ mergeParams: true });

// Protect all routes after this middleware
router.use(authController.protect);

router
  .route('/')
  .post(authController.restrictTo('user'), commentController.createComment)
  .get(commentController.getAllComments);

router
  .route('/:id')
  .get(commentController.getComment)
  .patch(authController.restrictTo('user'), commentController.updateComment)
  .delete(
    authController.restrictTo('user', 'admin'),
    commentController.deleteComment
  );

module.exports = router;
