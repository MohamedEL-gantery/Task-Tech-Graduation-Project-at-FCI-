const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const AppError = require('../utils/appError');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const multerOptions = () => {
  const multerStorage = multer.memoryStorage();

  const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
      cb(null, true);
    } else {
      cb(new AppError('Not an image! Please upload only images', 400), false);
    }
  };

  const maxSize = 5 * 1024 * 1024;

  const upload = multer({
    storage: multerStorage,
    limits: { fileSize: maxSize },
    fileFilter: multerFilter,
  });

  return upload;
};

const uploadToCloudinary = (file) => {
  if (!file || !file.buffer) {
    return Promise.resolve(null);
  }

  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream((error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      })
      .end(file.buffer);
  });
};

exports.uploadSingleImage = (fieldName) => {
  const upload = multerOptions().single(fieldName);

  return async (req, res, next) => {
    upload(req, res, async (error) => {
      if (error instanceof multer.MulterError) {
        next(new AppError('photo too large to upload', 400));
      } else if (error) {
        next(error);
      } else {
        try {
          const result = await uploadToCloudinary(req.file);
          req.fileUrl = result.secure_url;
          next();
        } catch (error) {
          next(error);
        }
      }
    });
  };
};

exports.uploadMixOfImages = (arrayOfFields) => {
  const upload = multerOptions().fields(arrayOfFields);

  return async (req, res, next) => {
    upload(req, res, async (error) => {
      if (error instanceof multer.MulterError) {
        next(new AppError('photo too large to upload', 400));
      } else if (error) {
        next(error);
      } else {
        try {
          const promises = arrayOfFields.map((field) => {
            return uploadToCloudinary(req.files[field.name][0]);
          });
          const results = await Promise.all(promises);
          req.fileUrls = results.map((result) => result.secure_url);
          next();
        } catch (error) {
          next(error);
        }
      }
    });
  };
};

exports.uploadToCloudinary = uploadToCloudinary;
