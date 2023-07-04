const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { utils } = require('cloudinary');
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

const uploadToCloudinary = async (fileBuffer) => {
  let buffer;

  if (typeof fileBuffer === 'object' && fileBuffer.constructor === Object) {
    // If the file buffer is an object, assume it is a JSON object and convert it to a string
    const jsonString = JSON.stringify(fileBuffer);

    // Convert the string to a buffer
    buffer = Buffer.from(jsonString, 'utf8');
  } else if (typeof fileBuffer === 'string') {
    // If the file buffer is a string, convert it to a buffer
    buffer = Buffer.from(fileBuffer, 'utf8');
  } else {
    // Otherwise, assume that the file buffer is already a buffer or a buffer-like object
    buffer = Buffer.from(fileBuffer);
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'public',
      },
      (error, result) => {
        if (error) {
          console.error('Error uploading file:', error);
          reject(error);
        } else {
          console.log('File uploaded successfully:', result);
          resolve(result);
        }
      }
    );

    // Check if the file is a valid image file
    const isValidImage = utils.isWebUri(buffer) && utils.isImage(buffer);

    if (!isValidImage) {
      const error = new Error('Invalid image file');
      console.error('Error uploading file:', error);
      reject(error);
      return;
    }

    uploadStream.end(buffer);
  });
};

exports.uploadSingleImage = (fieldName) => {
  const upload = multerOptions().single(fieldName);

  return async (req, res, next) => {
    upload(req, res, async (error) => {
      if (error) {
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
      if (error) {
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

module.exports = { uploadToCloudinary };
