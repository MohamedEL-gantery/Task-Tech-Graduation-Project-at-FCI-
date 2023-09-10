const express = require('express');
const authController = require('../Controllers/authController');
const categoryController = require('../Controllers/categoryController');

const router = express.Router();

// Protect all routes after this middleware
router.use(authController.protect);

router
  .route('/')
  .post(
    authController.restrictTo('admin'),
    categoryController.uploadCategoryPhoto,
    categoryController.resizeCategoryPhoto,
    categoryController.createCategory
  )
  .get(categoryController.getallCategory);

router
  .route('/:id')
  .get(categoryController.getOneCategory)
  .patch(
    authController.restrictTo('admin'),
    categoryController.uploadCategoryPhoto,
    categoryController.resizeCategoryPhoto,
    categoryController.updateCategory
  )
  .delete(
    authController.restrictTo('admin'),
    categoryController.deleteCategory
  );

module.exports = router;
