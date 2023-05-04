const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const Post = require('../models/postModel');
const User = require('../models/userModel');
const APIFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAync');
const AppError = require('../utils/appError');

exports.createPost = catchAsync(async (req, res, next) => {
  //Allow nested routes
  if (!req.body.user) req.body.user = req.params.userId;
  if (!req.body.user) req.body.user = req.user.id;

  const newPost = await Post.create(req.body);
  res.status(201).json({
    status: 'success',
    data: {
      post: newPost,
    },
  });
});

exports.getAllPosts = catchAsync(async (req, res, modelName = '', next) => {
  let filter = {};
  if (req.params.userId) filter = { user: req.params.userId };
  const documentsCounts = await Post.countDocuments();
  //EXCUTE QUERY
  const features = new APIFeatures(Post.find(filter), req.query)
    .filter()
    .sort()
    .limitFields()
    .search(modelName)
    .paginate(documentsCounts);

  //const posts = await features.query;
  const { query, paginationResult } = features;
  const posts = await query;

  res.status(200).json({
    status: 'success',
    results: posts.length,
    paginationResult,
    data: {
      posts,
    },
  });
});

exports.getPost = catchAsync(async (req, res, next) => {
  const post = await Post.findById(req.params.id)
    .populate('comments')
    .populate('user');

  if (!post) {
    return next(new AppError('No Post found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      post,
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

exports.updatePost = catchAsync(async (req, res, next) => {
  let post;
  post = await Post.findById(req.params.id);

  if (!post) {
    return next(new AppError('No Post found with that ID', 404));
  }
  if (req.user.id != post.user.id) {
    return next(
      new AppError(
        'You do not have permission to perform this action, Only for the owner of this post',
        401
      )
    );
  }

  await Post.findByIdAndUpdate(req.params.id, req.body, {
    new: true, //to return new document
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      post,
    },
  });
});

exports.deletePost = catchAsync(async (req, res, next) => {
  let post;
  post = await Post.findById(req.params.id);

  if (!post) {
    return next(new AppError('No Post found with that ID', 404));
  }

  if (req.user.id != post.user.id) {
    return next(
      new AppError(
        'You do not have permission to perform this action, Only for the owner of this post',
        401
      )
    );
  }

  await Post.findByIdAndDelete(req.params.id);

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

//saved / unsaved  post
exports.savePost = catchAsync(async (req, res, next) => {
  const post = await Post.findById(req.params.id);
  if (!post.saved.includes(req.user.id)) {
    await post.updateOne({ $push: { saved: req.user.id } });
    res.status(200).json({
      status: 'success',
      message: 'the post has been saved',
    });
  } else {
    await post.updateOne({ $pull: { saved: req.user.id } });
    res.status(200).json({
      status: 'success',
      message: 'the post has been unsaved',
    });
  }
});
