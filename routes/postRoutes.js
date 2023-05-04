const express = require('express');
const postController = require('../Controllers/postController');
const authController = require('../Controllers/authController');
const commentRouter = require('../routes/commentRoutes');

const router = express.Router({ mergeParams: true });

router.use(authController.protect);

//POST /post/234fad5/comments
//GET /post/234fad5/comments
//GET /post/234fad5/comments/123fds5
router.use(
  '/:postId/comments',
  authController.restrictTo('user'),
  commentRouter
);

router
  .route('/')
  .get(postController.getAllPosts)
  .post(authController.restrictTo('user'), postController.createPost);

router.get('/:id', postController.getPost);

router
  .route('/:id')
  .patch(
    //  postController.Owner,
    authController.restrictTo('user', 'admin'),
    postController.updatePost
  )
  .delete(
    authController.restrictTo('user', 'admin'),
    postController.deletePost
  );

router
  .route('/:id/saved')
  .put(authController.restrictTo('user'), postController.savePost);

module.exports = router;
