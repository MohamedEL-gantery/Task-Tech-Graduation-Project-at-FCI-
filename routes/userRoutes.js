const express = require('express');
const authController = require('../Controllers/authController');
const userController = require('../Controllers/userController');
const postRouter = require('./postRoutes');
const serviceRouter = require('./serviceRoutes');
const reviewRouter = require('./reviewRoutes');

const router = express.Router();

router.route('/signup').post(authController.signup);

router.route('/verfiysignup').post(authController.verifySignup);

router.route('/login').post(authController.login);

router.route('/logout').get(authController.logout);

router.route('/forgetpassword').post(authController.forgetPassword);

router.route('/verifyresetcode').post(authController.verifyPasswordResetCode);

router.route('/resetpassword').patch(authController.resetPassword);

// Protect all routes after this middleware
router.use(authController.protect);

// POST /revieweeId/234fd55/reviews
// GET /revieweeId/234fd55/reviews
router.use('/:revieweeId/reviews', reviewRouter);

// POST /userId/234fd55/service
// GET /userId/234fd55/service
router.use('/:userId/service', serviceRouter);

// POST /userId/234fd55/post
// GET /userId/234fd55/post
router.use('/:userId/post', postRouter);

router.route('/updatemypassword').patch(authController.updatePassword);

router
  .route('/createprofile/uploadphoto/me')
  .patch(
    authController.restrictTo('user'),
    userController.uploadUserPhoto,
    userController.resizeUserPhoto,
    userController.userPhoto
  );

router
  .route('/createprofile/me')
  .patch(
    authController.restrictTo('user'),
    userController.getMe,
    userController.updateUser
  );

router
  .route('/createprofile/portfolio/me')
  .patch(
    authController.restrictTo('user'),
    userController.uploadUserPortfolio,
    userController.resizePortfolioImages,
    userController.UserPortfolio
  );

router
  .route('/createprofile/uploadcv/me')
  .patch(
    authController.restrictTo('user'),
    userController.uploadUserFile,
    userController.uploadUserCV
  );

router.route('/me').get(userController.getMe, userController.getUser);

router.route('/deleteMe').delete(userController.deleteMe);

router.route('/alluser').get(userController.getAllUser);

router
  .route('/topuser')
  .get(userController.alisTopUser, userController.getAllUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(authController.restrictTo('admin'), userController.updateUser)
  .delete(authController.restrictTo('admin'), userController.deleteUser);

router
  .route('/:id/follow')
  .put(authController.restrictTo('user'), userController.followUser);

router
  .route('/:id/unfollow')
  .put(authController.restrictTo('user'), userController.unFollowUser);

router.route('/:id/timeline').get(userController.timeline);

router.route('/:search/search-user').get(userController.searchUser);

router.route('/:id/relatedPosts').get(userController.relatedPosts);

module.exports = router;
