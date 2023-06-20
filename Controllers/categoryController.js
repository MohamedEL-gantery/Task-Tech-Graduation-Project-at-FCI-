const sharp = require('sharp');
const Category = require('../models/categoryModel');
const catchAsync = require('../utils/catchAync');
const AppError = require('../utils/appError');
const uploadImageMiddleware = require('../middlewares/uploadImageMiddleware');
const { v4: uuidv4 } = require('uuid');

exports.uploadCategoryPhoto = uploadImageMiddleware.uploadSingleImage('photo');

exports.resizeCategoryPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  const filename = `category-${uuidv4()}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(600, 600)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/category/${filename}`);

  req.body.photo = filename;

  next();
});

exports.createCategory = catchAsync(async (req, req, next) => {
  const newCategory = await Category.create({
    _id: req.body._id,
    photo: req.body.photo,
  });
  res.status(201).json({
    status: 'success',
    data: {
      newCategory,
    },
  });
});
