const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const User = require('../models/userModel');
const Service = require('../models/serviceModel');
const APIFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAync');
const AppError = require('../utils/appError');

function checkFileType(file, cb) {
  const filetypes = /pdf/;
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype) {
    return cb(null, true);
  } else {
    cb(new AppError('pdf Only!', 400));
  }
}

const Storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/attachFile');
  },
  filename: (req, file, cb) => {
    const ext = file.mimetype.split('/')[1];
    cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
  },
});

const maxSize = 2 * 1024 * 1024;

const upload = multer({
  storage: Storage,
  limits: { fileSize: maxSize },
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

exports.uploadFile = upload.single('attachFile');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.createService = catchAsync(async (req, res, next) => {
  //Allow nested routes
  if (!req.body.user) req.body.user = req.params.userId;

  const filteredBody = filterObj(
    req.body,
    'name',
    'description',
    'delieveryDate',
    'softwareTool',
    'category',
    'salary',
    'user'
  );
  if (req.file) filteredBody.attachFile = req.file.filename;

  const newService = await Service.create(filteredBody);

  res.status(201).json({
    status: 'success',
    data: {
      newService,
    },
  });
});

exports.getAllService = catchAsync(
  async (req, res, modelName = 'Services', next) => {
    let filter = {};
    if (req.params.userId) filter = { user: req.params.userId };
    const documentsCounts = await Service.countDocuments();
    //EXCUTE QUERY
    const features = new APIFeatures(Service.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .search(modelName)
      .paginate(documentsCounts);

    const { query, paginationResult } = features;
    const service = await query;

    res.status(200).json({
      status: 'success',
      results: service.length,
      paginationResult,
      data: {
        service,
      },
    });
  }
);

exports.getService = catchAsync(async (req, res, next) => {
  const service = await Service.findById(req.params.id).populate('user');

  if (!service) {
    return next(new AppError('No Service found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      service,
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

exports.updateService = catchAsync(async (req, res, next) => {
  let service;
  service = await Service.findById(req.params.id);

  if (!service) {
    return next(new AppError('No Service found with that ID', 404));
  }

  if (req.user.id != service.user.id) {
    return next(
      new AppError(
        'You do not have permission to perform this action, Only for the owner of this service',
        401
      )
    );
  }

  const filteredBody = filterObj(
    req.body,
    'name',
    'description',
    'delieveryDate',
    'softwareTool',
    'category',
    'salary'
  );
  if (req.file) filteredBody.attachFile = req.file.filename;
  service = await Service.findByIdAndUpdate(req.params.id, filteredBody, {
    new: true, //to return new document
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      service,
    },
  });
});

exports.deleteService = catchAsync(async (req, res, next) => {
  let service;
  service = await Service.findById(req.params.id);

  if (!service) {
    return next(new AppError('No Service found with that ID', 404));
  }

  if (req.user.id != service.user.id) {
    return next(
      new AppError(
        'You do not have permission to perform this action, Only for the owner of this service',
        401
      )
    );
  }

  service = await Service.findByIdAndDelete(req.params.id);

  res.status(204).json({
    status: 'success',
    data: null,
  });
});
