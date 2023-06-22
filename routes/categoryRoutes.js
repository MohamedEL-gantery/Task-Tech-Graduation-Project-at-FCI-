const express = require('express');
const authController = require('../Controllers/authController');
const categoryController = require('../Controllers/categoryController');

const router = express.Router();

router.use(authController.protect);

router
  .route('/')
  .post(
    authController.restrictTo('admin'),
    categoryController.createCategory,
    categoryController.uploadCategoryPhoto,
    categoryController.resizeCategoryPhoto
  )
  .get(
    authController.restrictTo('admin', 'user'),
    categoryController.getallCategory
  );

router.use(authController.restrictTo('admin'));

router
  .route('/:id')
  .patch(
    categoryController.updateCategory,
    categoryController.uploadCategoryPhoto,
    categoryController.resizeCategoryPhoto
  )
  .delete(categoryController.deleteCategory);

module.exports = router;
