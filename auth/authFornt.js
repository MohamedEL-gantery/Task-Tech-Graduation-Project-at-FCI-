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
  // 1) Create new account
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
  });
  newUser.ResetVerified = true;

  await newUser.save();
  // 2) Send it to email
  const date = new Date();
  const options = { timeZone: 'Africa/Cairo' };
  const dateString = date.toLocaleString('en-US', options);

  const message = `Hello ${newUser.name},\n Glad to have you. \n  Welcome to TASK-TECH \n We received a request to sign up on TASK-TECH in ${dateString}. \n We are thrilled to have you as a new member of our community.\n The TASK TECH Team`;

  try {
    sendEmail({
      email: newUser.email,
      subject: "Welcome to TASK TECH, we 're glad to have you",
      message,
    });
    // 3) If everything is ok, generate token
    createSendToken(newUser, 200, req, res);
  } catch (err) {
    return next(
      new AppError('There was an error sending the email. Try again later!'),
      500
    );
  }
});
