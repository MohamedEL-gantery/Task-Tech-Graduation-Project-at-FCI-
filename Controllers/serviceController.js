const Service = require('../models/serviceModel');
const APIFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAync');
const AppError = require('../utils/appError');
const multer = require('multer');

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
    cb(null, 'public/img/attachFile');
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

exports.getAllService = catchAsync(async (req, res, modelName = '', next) => {
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

  // const service = await features.query;

  const { query, paginationResult } = features;
  const service = await query;

  res.status(200).json({
    status: 'success',
    paginationResult,
    results: service.length,
    data: {
      service,
    },
  });
});

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

exports.updateService = catchAsync(async (req, res, next) => {
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
  const service = await Service.findByIdAndUpdate(req.params.id, filteredBody, {
    new: true, //to return new document
    runValidators: true,
  });

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

exports.deleteService = catchAsync(async (req, res, next) => {
  const service = await Service.findByIdAndDelete(req.params.id);

  if (!service) {
    return next(new AppError('No Service found with that ID', 404));
  }

  res.status(204).json({
    status: 'success',
    data: {
      service,
    },
  });
});
