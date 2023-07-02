const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAync');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, req, res) => {
  const token = signToken(user._id);

  res.cookie('jwt', token, {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
  });

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  // 1) Signup
  let newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
  });

  // 2) Generate hash reset random 4 digits and save it in db
  const resetCode = newUser.generateVerificationCode();
  const token = signToken(newUser._id);
  await newUser.save({ validateBeforeSave: false });

  // 3) Send it to newUser's email
  const date = new Date();
  const hoursAndMinutes = date.getHours() + ':' + date.getMinutes();
  const message = `Hello ${newUser.name},\n Glad to have you. \n We received a request to sign up on TASK-TECH in ${hoursAndMinutes}. \n ${resetCode} \n Please confirm this code to complete the sign up.\n Once confirmed, you'll be able to log in with your new account. \n The TASK TECH Team`;

  try {
    sendEmail({
      email: newUser.email,
      subject: 'Your verification code (valid for 10 min)',
      message,
    });

    res.status(201).json({
      status: 'success',
      token,
      message: 'Verification Code sent to Email',
    });
  } catch (err) {
    newUser.ResetCode = undefined;
    newUser.ResetExpires = undefined;
    newUser.ResetVerified = undefined;
    await newUser.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending the email. Try again later!'),
      500
    );
  }
  req.user = newUser;
});

exports.verfiySignUp = catchAsync(async (req, res, next) => {
  // 1) Get user based on reset code
  const hashedResetCode = crypto
    .createHash('sha256')
    .update(req.body.resetCode)
    .digest('hex');

  let currentToken;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    currentToken = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    currentToken = req.cookies.jwt;
  }

  // 2) Verification token
  const decoded = await promisify(jwt.verify)(
    currentToken,
    process.env.JWT_SECRET
  );

  // 3) Check if user still exists
  let user = await User.findById(decoded.id);
  if (!user) {
    return next(
      new AppError(
        'The token belonging to this user does not longer exist.',
        401
      )
    );
  }

  user = await User.findOne({
    ResetCode: hashedResetCode,
    ResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    await User.findByIdAndDelete(decoded.id);
    return next(new AppError('Reset code invalid or expired'));
  }
  // 4) Reset code valid
  user.ResetCode = undefined;
  user.ResetExpires = undefined;
  user.ResetVerified = true;

  await user.save({ validateBeforeSave: false });
  // 5) If everything ok, send token to client
  createSendToken(user, 201, req, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError(' please enter your email or password', 400));
  }
  // 2) Check if user exists && password is correct && resetVerified is true
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('invalid email or password', 401));
  }

  if (user.ResetVerified != true) {
    return next(new AppError('this user does not longer exist', 401));
  }

  // 3) Send it to email
  const date = new Date();
  const hoursAndMinutes = date.getHours() + ':' + date.getMinutes();

  const message = `Hi ${user.name},\n You have loged in ${hoursAndMinutes}. \n The TASK TECH Team`;

  try {
    sendEmail({
      email: user.email,
      subject: "Welcome to TASK TECH, we 're glad to have you",
      message,
    });
    // 4) If everything ok, send token to client
    createSendToken(user, 200, req, res);
  } catch (err) {
    return next(
      new AppError('There was an error sending the email. Try again later!'),
      500
    );
  }
});

exports.protect = catchAsync(async (req, res, next) => {
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

exports.forgetPassword = catchAsync(async (req, res, next) => {
  // 1) Get User Based on Posted Email
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(
      new AppError(`There is no user with email ${req.body.email}`, 404)
    );
  }
  // 2) If user exist, Generate hash reset random 4 digits and save it in db
  const resetCode = user.createPasswordResetCode();
  await user.save({ validateBeforeSave: false });
  // Send it to user's email
  const date = new Date();
  const hoursAndMinutes = date.getHours() + ':' + date.getMinutes();

  const message = `Hi ${user.name},\n We received a request to reset the password on your TASK-TECH Account in ${hoursAndMinutes}. \n ${resetCode} \n Enter this code to complete the reset. \n Thanks for helping us keep your account secure.\n The TASK TECH Team`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset code (valid for 10 min)',
      message,
    });
    res.status(200).json({
      status: 'success',
      message: 'Code sent to Email',
    });
  } catch (err) {
    user.passwordResetCode = undefined;
    user.passwordResetExpires = undefined;
    user.passwordResetVerified = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending the email. Try again', 500)
    );
  }
});

exports.verifyPasswordResetCode = catchAsync(async (req, res, next) => {
  // 1) Get user based on reset code
  const hashedResetCode = crypto
    .createHash('sha256')
    .update(req.body.resetCode)
    .digest('hex');

  const user = await User.findOne({
    passwordResetCode: hashedResetCode,
    passwordResetExpires: { $gt: Date.now() },
  });
  if (!user) {
    return next(new AppError('Reset code invalid or expired', 400));
  }

  // 2) Reset code valid
  user.passwordResetVerified = true;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'success',
  });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on email
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(
      new AppError(`There is no user with email ${req.body.email}`, 404)
    );
  }

  // 2) Check if reset code verified
  if (!user.passwordResetVerified) {
    return next(new AppError('Reset code not verified', 400));
  }

  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  user.passwordResetCode = undefined;
  user.passwordResetExpires = undefined;
  user.passwordResetVerified = undefined;

  await user.save();

  // 3) if everything is ok, generate token
  createSendToken(user, 200, req, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');

  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError(' Your current password is wrong', 401));
  }
  // update password
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  await user.save();

  // if everything is ok, generate token
  createSendToken(user, 200, req, res);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles ['admin']. role='user'
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };
};
