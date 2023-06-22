const express = require('express');
const authController = require('../Controllers/authController');
const categoryController = require('../Controllers/categoryController');

const router = express.Router();

router.use(authController.protect);

router
  .route('/')
  .post(
    authController.restrictTo('admin'),
    categoryController.uploadCategoryPhoto,
    categoryController.resizeCategoryPhoto,
    categoryController.createCategory
  )
  .get(
    authController.restrictTo('admin', 'user'),
    categoryController.getallCategory
  );

router.use(authController.restrictTo('admin'));

router
  .route('/:id')
  .patch(
    categoryController.uploadCategoryPhoto,
    categoryController.resizeCategoryPhoto,
    categoryController.updateCategory
  )
  .delete(categoryController.deleteCategory);

module.exports = router;
