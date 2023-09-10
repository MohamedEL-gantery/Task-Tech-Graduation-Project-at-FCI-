const express = require('express');
const authController = require('../Controllers/authController');
const orderConroller = require('../Controllers/orderController');

const router = express.Router();

// Protect all routes after this middleware
router.use(authController.protect);

router
  .route('/checkout-session/:serviceId')
  .get(authController.restrictTo('user'), orderConroller.CheckoutSession);

router.route('/').get(orderConroller.getAllOrder);

router.use(authController.restrictTo('admin'));

router
  .route('/:id')
  .get(orderConroller.getOneOrder)
  .patch(orderConroller.updateOrder)
  .delete(orderConroller.deleteOrder);

module.exports = router;
