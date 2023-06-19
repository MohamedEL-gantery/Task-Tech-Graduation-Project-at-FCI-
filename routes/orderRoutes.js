const express = require('express');
const orderConroller = require('../Controllers/orderController');
const authController = require('../Controllers/authController');

const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router.get(
  '/checkout-session/:serviceId',
  authController.restrictTo('user'),
  orderConroller.CheckoutSession
);

router.use(authController.restrictTo('admin'));

router
  .route('/')
  .get(authController.restrictTo('user'), orderConroller.getAllOrder);

router
  .route('/:id')
  .get(orderConroller.getOneOrder)
  .patch(orderConroller.updateOrder)
  .delete(orderConroller.deleteOrder);
module.exports = router;
