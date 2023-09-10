const Post = require('../models/postModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');
const uploadImageMiddleware = require('../middlewares/uploadImageMiddleware');

exports.uploadFile = uploadImageMiddleware.uploadSingleImage('attachFile');

exports.resizeAttachFile = catchAsync(async (req, res, next) => {
  if (!req.file) return next();
  try {
    const result = await uploadImageMiddleware.uploadToCloudinary(req.file);

    req.body.attachFile = result.secure_url;
    next();
  } catch (error) {
    next(error);
  }
});

exports.createPost = catchAsync(async (req, res, next) => {
  //Allow nested routes
  if (!req.body.user) req.body.user = req.params.userId;

  const newPost = await Post.create(req.body);
  res.status(201).json({
    status: 'success',
    data: {
      post: newPost,
    },
  });
});

exports.getAllPosts = catchAsync(async (req, res, next) => {
  let filter = {};
  if (req.params.userId) filter = { user: req.params.userId };
  const documentsCounts = await Post.countDocuments();
  //EXCUTE QUERY
  const features = new APIFeatures(Post.find(filter), req.query)
    .filter()
    .sort()
    .limitFields()
    .search()
    .paginate(documentsCounts);

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
  let post;
  post = await Post.findById(req.params.id);

  if (!post) {
    return next(new AppError('No Post found with that ID', 404));
  }

  if (req.user.role !== 'admin' && req.user.id !== post.user.id) {
    return next(
      new AppError(
        'You do not have permission to perform this action. This action is only allowed for the owner of this post and admin.',
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

  if (req.user.role !== 'admin' && req.user.id !== post.user.id) {
    return next(
      new AppError(
        'You do not have permission to perform this action. This action is only allowed for the owner of this post and admin.',
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

//search post
exports.searchPost = catchAsync(async (req, res, next) => {
  const search = req.params.search;
  const posts = await Post.find({
    $or: [
      { name: { $regex: '.*' + search + '.*' } },
      { description: { $regex: '.*' + search + '.*' } },
    ],
  });
  if (posts.length > 0) {
    res.status(200).json({
      status: 'success',
      message: 'posts datails',
      results: posts.length,
      posts,
    });
  } else {
    res.status(200).json({
      status: 'success',
      message: 'posts not found!',
    });
  }
});
