const express = require('express');
const postController = require('../Controllers/postController');
const authController = require('../Controllers/authController');
const commentRouter = require('../routes/commentRoutes');

const router = express.Router({ mergeParams: true });

router.use(authController.protect);

//POST /post/234fad5/comments
//GET /post/234fad5/comments
//GET /post/234fad5/comments/123fds5
router.use('/:postId/comments', commentRouter);

router
  .route('/')
  .get(postController.getAllPosts)
  .post(
    authController.restrictTo('user'),
    postController.uploadFile,
    postController.resizeAttachFile,
    postController.createPost
  );

router.get('/:id', postController.getPost);

router
  .route('/:id')
  .patch(
    authController.restrictTo('user', 'admin'),
    postController.isOwner,
    postController.updatePost
  )
  .delete(
    authController.restrictTo('user', 'admin'),
    postController.isOwner,
    postController.deletePost
  );

router
  .route('/:id/saved')
  .put(authController.restrictTo('user'), postController.savePost);

router.route('/:search/search-post').get(postController.searchPost);

module.exports = router;
