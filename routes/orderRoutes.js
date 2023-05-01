const express = require('express');
const orderConroller = require('../Controllers/orderController');
const authController = require('../Controllers/authController');

const router = express.Router();

router.use(authController.protect);

router.get(
  '/checkout-session/:serviceId',
  authController.restrictTo('user'),
  orderConroller.CheckoutSession
);

module.exports = router;
