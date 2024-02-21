const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const catchAsync = require('../utils/catchAsync');
const User = require('./../models/userModel');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');
const { promisify } = require('util');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true;
  }

  res.cookie('jwt', token, cookieOptions);
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success ✅',
    token,
    data: {
      user,
    },
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

  createSendToken(newUser, 201, res);
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

  createSendToken(user, 200, res);
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
  const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}\n`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'our password reset token (valid for 10min)',
      message,
    });

    res.status(200).json({
      status: 'success ',
      message: 'Token send to email',
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'There was an error sending the email; Try again later',
        500,
      ),
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1)get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2) if token has not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  // 3) Update properties for the user
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save({ validateBeforeSave: false });

  // 4) log the user in, send Jwt
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  const user = await User.findById(req.user.id).select('+password');

  // 2) Check if POSTed current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong.', 401));
  }

  // 3) If so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // User.findByIdAndUpdate will NOT work as intended!

  // 4) Log user in, send JWT
  createSendToken(user, 200, res);
});
