const Category = require('../models/categoryModel');
const catchAsync = require('../utils/catchAync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');
const uploadImageMiddleware = require('../middlewares/uploadImageMiddleware');

exports.uploadCategoryPhoto = uploadImageMiddleware.uploadSingleImage('photo');

exports.resizeCategoryPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  try {
    const result = await uploadImageMiddleware.uploadToCloudinary(req.file);

    req.body.photo = result.secure_url;
    next();
  } catch (error) {
    next(error);
  }
});

exports.createCategory = catchAsync(async (req, res, next) => {
  const newCategory = await Category.create(req.body);
  res.status(201).json({
    status: 'success',
    data: {
      newCategory,
    },
  });
});

exports.getallCategory = catchAsync(async (req, res, next) => {
  const documentsCounts = await Category.countDocuments();
  const features = new APIFeatures(Category.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .search()
    .paginate(documentsCounts);

  const { query, paginationResult } = features;

  const category = await query;

  res.status(200).json({
    status: 'success',
    results: category.length,
    paginationResult,
    data: {
      category,
    },
  });
});

exports.getOneCategory = catchAsync(async (req, res, next) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    return next(new AppError('No Category Found With this  ID'), 404);
  }

  res.status(200).json({
    status: 'success',
    data: {
      category,
    },
  });
});

exports.updateCategory = catchAsync(async (req, res, next) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true, // to return new document
    runValidators: true,
  });

  if (!category) {
    return next(new AppError('No Category Found With this  ID'), 404);
  }

  await category.save();

  res.status(200).json({
    status: 'success',
    data: {
      category,
    },
  });
});

exports.deleteCategory = catchAsync(async (req, res, next) => {
  const category = await Category.findByIdAndDelete(req.params.id);

  if (!category) {
    return next(new AppError('No Category Found With this  ID'), 404);
  }

  res.status(204).json({
    status: 'success',
    data: null,
  });
});
