const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const Review = require('../models/reviewModel');
const catchAsync = require('../utils/catchAync');
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
    // .search()
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

exports.isOwner = catchAsync(async (req, res, next) => {
  // 1) Getting token and check of it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401)
    );
  }
  // 2) Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError('The user belonging to this token does no longer exist', 401)
    );
  }

  // 4) Check if user changed password after the token was issued
  if (currentUser.changedPassword(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again', 401)
    );
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

exports.updateReview = catchAsync(async (req, res, next) => {
  let review;
  review = await Review.findById(req.params.id);

  if (!review) {
    return next(new AppError('No Review found with that ID', 404));
  }

  if (req.user.id != review.reviewer.id) {
    return next(
      new AppError(
        'You do not have permission to perform this action, Only for the owner of this review',
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

  if (req.user.id != review.reviewer.id) {
    return next(
      new AppError(
        'You do not have permission to perform this action, Only for the owner of this review',
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
