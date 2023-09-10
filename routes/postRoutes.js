const express = require('express');
const authController = require('../Controllers/authController');
const postController = require('../Controllers/postController');
const commentRouter = require('../routes/commentRoutes');

const router = express.Router({ mergeParams: true });

// Protect all routes after this middleware
router.use(authController.protect);

//POST /post/234fad5/comments
//GET /post/234fad5/comments
router.use('/:postId/comments', commentRouter);

router
  .route('/')
  .post(
    authController.restrictTo('user'),
    postController.uploadFile,
    postController.resizeAttachFile,
    postController.createPost
  )
  .get(postController.getAllPosts);

router
  .route('/:id')
  .get(postController.getPost)
  .patch(
    authController.restrictTo('user'),
    postController.uploadFile,
    postController.resizeAttachFile,
    postController.updatePost
  )
  .delete(
    authController.restrictTo('user', 'admin'),
    postController.deletePost
  );

router
  .route('/:id/saved')
  .put(authController.restrictTo('user'), postController.savePost);

router.route('/:search/search-post').get(postController.searchPost);

module.exports = router;
