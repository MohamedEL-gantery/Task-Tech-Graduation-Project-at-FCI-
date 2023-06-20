const express = require('express');
const authController = require('../Controllers/authController');
const categoryController = require('../Controllers/categoryController');

const router = express.Router();

router.use(authController.protect);

router.use(authController.restrictTo('admin'));

router
  .route('/')
  .post(
    categoryController.createCategory,
    categoryController.uploadCategoryPhoto,
    categoryController.resizeCategoryPhoto
  )
  .get(categoryController.getallCategory);

router
  .route('/:id')
  .patch(categoryController.updateCategory)
  .delete(categoryController.deleteCategory);

module.exports = router;
