const multer = require('multer');
const AppError = require('../utils/appError');

const multerOptions = () => {
  const Storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'public/cv');
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

  const maxSize = 5 * 1024 * 1024;

  const upload = multer({
    storage: Storage,
    limits: { fileSize: maxSize },
    fileFilter: function (req, file, cb) {
      checkFileType(file, cb);
    },
  });

  return upload;
};

exports.uploadPdf = (fieldName) => multerOptions().single(fieldName);
