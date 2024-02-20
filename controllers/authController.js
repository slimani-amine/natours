const jwt = require('jsonwebtoken');
const catchAsync = require('../utils/catchAsync');
const User = require('./../models/userModel');
const AppError = require('../utils/appError');
const { promisify } = require('util');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role,
  });

  const token = signToken(newUser._id);

  res.status(201).json({
    status: 'success ✅',
    token,
    data: {
      user: newUser,
    },
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    next(new AppError('Please provide email and password 🛑', 404));
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return res.status(401).json({
      status: 401,
      error: 'Invalid user with this credentials 🛑',
    });
  }

  const isMatch = user.correctPassword(password, user.password);

  if (!isMatch) {
    return res.status(401).json({
      status: 401,
      error: 'Password incorrect 🛑',
    });
  }

  const token = signToken(user._id);

  res.status(200).json({
    status: 'success ✅',
    token,
    data: {
      user,
    },
  });
});

exports.protect = catchAsync(async (req, res, next) => {
  // 1) getting the token and check of it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('You are not logged in ! 🛑', 401));
  }

  // 2) verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  console.log('🚀 ~ exports.protect=catchAsync ~ decoded:', decoded);

  // 3) check if user still exists
  const freshUser = await User.findById(decoded.id);

  if (!freshUser) {
    return next(
      new AppError(
        'The User belonging to this token does no longer exist! 🛑',
        404,
      ),
    );
  }

  // 4)check if user changed password after jwt was issued
  if (freshUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError(
        'Your password has changed since you last logged in! 🛑',
        401,
      ),
    );
  }

  req.user = freshUser;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You are not authorized to access this resource! 🛑', 403),
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(
      new AppError('There is no user with this email address 🛑', 404),
    );
  }

  // 2) Generate the random reset
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) Send it to user's email
});

exports.resetPassword = (req, res, next) => {};
