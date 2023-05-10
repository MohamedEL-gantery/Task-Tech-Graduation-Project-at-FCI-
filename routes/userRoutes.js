const express = require('express');
const authController = require('../Controllers/authController');
const userController = require('../Controllers/userController');
const reviewRouter = require('./reviewRoutes');
const serviceRouter = require('./serviceRoutes');
const PostRouter = require('./postRoutes');

const router = express.Router();

router.post('/signup', authController.SignUp);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

router.post('/forgetpassword', authController.forgetPassword);
router.post('/verifyresetcode', authController.verifyPasswordResetCode);
router.patch('/resetpassword', authController.resetPassword);

router.get('/topuser', userController.alisTopUser, userController.getAllUser);

// Protect all routes after this middleware
router.use(authController.protect);

router.patch('/updatemypassword', authController.updatePassword);

router.patch(
  '/createprofile/uploadphoto/me',
  authController.restrictTo('user'),
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.userPhoto
);

router.patch(
  '/createprofile/me',
  authController.restrictTo('user'),
  userController.getMe,
  userController.updateUser
);

router.patch(
  '/createprofile/portfolio/me',
  authController.restrictTo('user'),
  userController.uploadUserPortfolio,
  userController.resizePortfolioImages,
  userController.UserPortfolio
);

router.patch(
  '/createprofile/uploadcv/me',
  authController.restrictTo('user'),
  userController.uploadUserFile,
  userController.uploadUserCV
);

router.get('/me', userController.getMe, userController.getUser);

router.delete('/deleteMe', userController.deleteMe);

router.get('/alluser', userController.getAllUser);

router
  .route('/:id')
  .get(authController.restrictTo('admin', 'user'), userController.getUser)
  .patch(authController.restrictTo('admin'), userController.updateUser)
  .delete(authController.restrictTo('admin'), userController.deleteUser);

//follow user route
router
  .route('/:id/follow')
  .put(authController.restrictTo('user'), userController.followUser);

//unfollow user route
router
  .route('/:id/unfollow')
  .put(authController.restrictTo('user'), userController.unFollowUser);

//timeline posts
router.route('/:id/timeline').get(userController.timeline);

// POST /revieweeId/234fd55/reviews
// GET /revieweeId/234fd55/reviews
// GET /revieweeId/234fd55/reviews/9487fd55
router.use('/:revieweeId/reviews', reviewRouter);

// POST /userId/234fd55/service
// GET /userId/234fd55/service
// GET /userId/234fd55/service/9487fd55
router.use('/:userId/service', serviceRouter);

// POST /userId/234fd55/post
// GET /userId/234fd55/post
// GET /userId/234fd55/post/9487fd55
router.use('/:userId/post', PostRouter);

module.exports = router;
