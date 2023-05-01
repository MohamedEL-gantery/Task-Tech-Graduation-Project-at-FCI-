const Post = require('../models/postModel');
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

exports.updatePost = catchAsync(async (req, res, next) => {
  const post = await Post.findByIdAndUpdate(req.params.id, req.body, {
    new: true, //to return new document
    runValidators: true,
  });

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
exports.deletePost = catchAsync(async (req, res, next) => {
  const post = await Post.findByIdAndDelete(req.params.id);

  if (!post) {
    return next(new AppError('No Post found with that ID', 404));
  }

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
