const express = require('express');
const authController = require('../Controllers/authController');
const serviceController = require('../Controllers/serviceController');

const router = express.Router({ mergeParams: true });

router
  .route('/')
  .post(
    authController.protect,
    authController.restrictTo('user'),
    serviceController.uploadFile,
    serviceController.createService
  )
  .get(serviceController.getAllService);

router
  .route('/:id')
  .get(serviceController.getService)
  .patch(
    authController.protect,
    authController.restrictTo('user', 'admin'),
    serviceController.uploadFile,
    serviceController.updateService
  )
  .delete(
    authController.protect,
    authController.restrictTo('user', 'admin'),
    serviceController.deleteService
  );

module.exports = router;
