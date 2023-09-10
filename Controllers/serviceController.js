const Service = require('../models/serviceModel');
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

exports.createService = catchAsync(async (req, res, next) => {
  //Allow nested routes
  if (!req.body.user) req.body.user = req.params.userId;

  const newService = await Service.create(req.body);

  res.status(201).json({
    status: 'success',
    data: {
      newService,
    },
  });
});

exports.getAllService = catchAsync(async (req, res, next) => {
  let filter = {};
  if (req.params.userId) filter = { user: req.params.userId };
  const documentsCounts = await Service.countDocuments();
  //EXCUTE QUERY
  const features = new APIFeatures(Service.find(filter), req.query)
    .filter()
    .sort()
    .limitFields()
    .search()
    .paginate(documentsCounts);
  const { query, paginationResult } = features;
  const services = await query;

  res.status(200).json({
    status: 'success',
    results: services.length,
    paginationResult,
    data: {
      services,
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
  let service;
  service = await Service.findById(req.params.id);

  if (!service) {
    return next(new AppError('No Service found with that ID', 404));
  }

  if (req.user.role !== 'admin' && req.user.id != service.user.id) {
    return next(
      new AppError(
        'You do not have permission to perform this action. This action is only allowed for the owner of this service and admin.',
        401
      )
    );
  }

  service = await Service.findByIdAndUpdate(req.params.id, req.body, {
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

  if (req.user.role !== 'admin' && req.user.id != service.user.id) {
    return next(
      new AppError(
        'You do not have permission to perform this action. This action is only allowed for the owner of this service and admin.',
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

//search service
exports.searchService = catchAsync(async (req, res, next) => {
  const search = req.params.search;
  const services = await Service.find({
    $or: [
      { name: { $regex: '.*' + search + '.*' } },
      { description: { $regex: '.*' + search + '.*' } },
    ],
  });
  if (services.length > 0) {
    res.status(200).json({
      status: 'success',
      message: 'services datails',
      results: services.length,
      services,
    });
  } else {
    res.status(200).json({
      status: 'success',
      message: 'services not found!',
    });
  }
});
