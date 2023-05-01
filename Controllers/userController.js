const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/userModel');
const Post = require('../models/postModel');
const catchAsync = require('../utils/catchAync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

// UPLOAD PHOTO FOR PORTFOLIO
exports.uploadUserPortfolio = upload.fields([{ name: 'images', maxCount: 6 }]);
// Filter
exports.resizePortfolioImages = catchAsync(async (req, res, next) => {
  if (!req.files.images) return next();

  req.body.images = [];

  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `userportfolio-${req.user.id}-${Date.now()}-${
        i + 1
      }.jpeg`;

      await sharp(file.buffer)
        .resize(800, 800)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/portfolio/${filename}`);

      req.body.images.push(filename);
    })
  );
  next();
});

exports.UserPortfolio = catchAsync(async (req, res, next) => {
  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updatemypassword.',
        400
      )
    );
  }
  // 2) Update user document
  const data = await User.findByIdAndUpdate(
    req.user.id,
    { images: req.body.images },
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    status: 'Success',
    data: {
      data,
    },
  });
});

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

// UPLOAD USER PHOTO
exports.uploadUserPhoto = upload.single('photo');

// Filter
exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

exports.UserPhoto = catchAsync(async (req, res, next) => {
  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updatemypassword.',
        400
      )
    );
  }
  // 2) Filtered
  const filteredBody = filterObj(
    req.body,
    'name',
    'email',
    'gender',
    'age',
    'birthDate',
    'location',
    'phoneNumber',
    'skills'
  );
  if (req.file) filteredBody.photo = req.file.filename;
  // 3) Update user document
  const data = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true, // to return new document
    runValidators: true,
  });

  res.status(200).json({
    status: 'Success',
    data: {
      data,
    },
  });
});

// UPLOAD CV
const Storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, '/public/img/cv');
  },
  filename: (req, file, cb) => {
    const ext = file.mimetype.split('/')[1];
    cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
  },
});

// Filter
function checkFileType(file, cb) {
  const filetypes = /pdf/;
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype) {
    return cb(null, true);
  } else {
    cb(new AppError('pdf Only!', 400));
  }
}

const maxSize = 2 * 1024 * 1024;

const uploadFile = multer({
  storage: Storage,
  limits: { fileSize: maxSize },
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

exports.uploadUserFile = uploadFile.single('cv');

exports.UploadCv = catchAsync(async (req, res, next) => {
  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updatemypassword.',
        400
      )
    );
  }
  // 2) Filtered
  const filteredBody = filterObj(req.body, 'education');
  if (req.file) filteredBody.cv = req.file.filename;
  // 3) Update user document
  const data = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true, // to return new document
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      data,
    },
  });
});

// CREATE PROFILE
exports.updateUser = catchAsync(async (req, res, next) => {
  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updatemypassword.',
        400
      )
    );
  }
  // 2) Update user document
  const data = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true, // to return new document
    runValidators: true,
  });

  res.status(200).json({
    status: 'Success',
    data: {
      data,
    },
  });
});

exports.getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id).populate('reviews');

  if (!user) {
    return next(new AppError('no user found with that id', 404));
  }
  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.getAllUser = catchAsync(async (req, res, modelName = '', next) => {
  const documentsCounts = await User.countDocuments();
  const features = new APIFeatures(User.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .search(modelName)
    .paginate(documentsCounts);

  // const data = await features.query;

  const { query, paginationResult } = features;
  const data = await query;

  res.status(200).json({
    status: 'success',
    paginationResult,
    results: data.length,
    data: {
      data,
    },
  });
});

exports.deleteUser = catchAsync(async (req, res, next) => {
  const data = await User.findByIdAndDelete(req.params.id);

  if (!data) {
    return next(new AppError('No User found with that ID', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.alisTopUser = (req, res, next) => {
  (req.query.limit = '4'),
    (req.query.sort = '-ratingsAverage'),
    (req.query.fields = 'name,ratingsAverage,photo,skills,ratingsQuantity,jop');
  next();
};

// follow user
exports.followUser = catchAsync(async (req, res, next) => {
  if (req.user.id !== req.params.id) {
    const user = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.id);

    if (!user.followers.includes(req.user.id)) {
      await user.updateOne({ $push: { followers: req.user.id } });
      await currentUser.updateOne({ $push: { followings: req.params.id } });

      res.status(200).json({
        status: 'success',
        message: 'user has been followed',
      });
    } else {
      return next(new AppError('you already follow this user', 404));
    }
  } else {
    return next(new AppError('you can not follow yourself', 404));
  }
});

//unfollow user
exports.unFollowUser = catchAsync(async (req, res, next) => {
  if (req.user.id !== req.params.id) {
    const user = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.id);

    if (user.followers.includes(req.user.id)) {
      await user.updateOne({ $pull: { followers: req.user.id } });
      await currentUser.updateOne({ $pull: { followings: req.params.id } });

      res.status(200).json({
        status: 'success',
        message: 'user has been unfollowed',
      });
    } else {
      return next(new AppError('you donnot follow this user', 404));
    }
  } else {
    return next(new AppError('you can not unfollow yourself', 404));
  }
});

//timeline posts
exports.timeline = catchAsync(async (req, res, next) => {
  if (!req.params.id) req.params.id = req.user.id;
  const currentUser = await User.findById(req.params.id);
  const userPosts = await Post.find({ user: currentUser._id });
  const friendPosts = await Promise.all(
    currentUser.followings.map((friendId) => {
      return Post.find({ user: friendId });
    })
  );

  res.status(200).json(userPosts.concat(...friendPosts));
});
