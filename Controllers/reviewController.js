const Review = require('../models/reviewModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

exports.createReview = catchAsync(async (req, res, next) => {
  //Allow nested routes
  if (!req.body.reviewee) req.body.reviewee = req.params.revieweeId;
  if (!req.body.reviewer) req.body.reviewer = req.user.id;

  const newReview = await Review.create(req.body);

  res.status(201).json({
    status: 'success',
    data: {
      review: newReview,
    },
  });
});

exports.getAllReviews = catchAsync(async (req, res, next) => {
  let filter = {};
  if (req.params.revieweeId) filter = { reviewee: req.params.revieweeId };
  const documentsCounts = await Review.countDocuments();
  const features = new APIFeatures(Review.find(filter), req.query)
    .filter()
    .sort()
    .limitFields()
    .search()
    .paginate(documentsCounts);

  const { query, paginationResult } = features;
  const reviews = await query;

  res.status(200).json({
    status: 'success',
    results: reviews.length,
    paginationResult,
    data: {
      reviews,
    },
  });
});

exports.getReview = catchAsync(async (req, res, next) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(new AppError('No Review found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      review,
    },
  });
});

exports.updateReview = catchAsync(async (req, res, next) => {
  let review;
  review = await Review.findById(req.params.id);

  if (!review) {
    return next(new AppError('No Review found with that ID', 404));
  }

  if (req.user.role !== 'admin' && req.user.id != review.reviewer.id) {
    return next(
      new AppError(
        'You do not have permission to perform this action. This action is only allowed for the owner of this review and admin.',
        401
      )
    );
  }

  await Review.findByIdAndUpdate(req.params.id, req.body, {
    new: true, //to return new document
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      review,
    },
  });
});

exports.deleteReview = catchAsync(async (req, res, next) => {
  let review;
  review = await Review.findById(req.params.id);

  if (!review) {
    return next(new AppError('No Review found with that ID', 404));
  }

  if (req.user.role !== 'admin' && req.user.id != review.reviewer.id) {
    return next(
      new AppError(
        'You do not have permission to perform this action. This action is only allowed for the owner of this review and admin.',
        401
      )
    );
  }

  review = await Review.findByIdAndDelete(req.params.id);

  res.status(204).json({
    status: 'success',
    data: null,
  });
});
