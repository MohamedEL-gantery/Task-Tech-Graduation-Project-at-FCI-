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
  const storage = multer.memoryStorage();

  // Filter
  // function checkFileType(file, cb) {
  //   const filetypes = /pdf/;
  //   const mimetype = filetypes.test(file.mimetype);

  //   if (mimetype) {
  //     return cb(null, true);
  //   } else {
  //     cb(new AppError('PDF Only!', 400));
  //   }
  // }

  const maxSize = 5 * 1024 * 1024;

  const upload = multer({
    storage,
    limits: { fileSize: maxSize },
    // fileFilter: function (req, file, cb) {
    //   checkFileType(file, cb);
    // },
  });

  return upload;
};

const uploadToCloudinary = (file) => {
  if (!file || !file.buffer) {
    return Promise.resolve({});
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

exports.uploadPdf = (fieldName) => {
  const upload = multerOptions().single(fieldName);

  return async (req, res, next) => {
    upload(req, res, async (error) => {
      if (error instanceof multer.MulterError) {
        next(new AppError('pdf too large to upload', 400));
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
