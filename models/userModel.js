const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // _id: 'UUID',
  name: {
    type: String,
    required: [true, 'A user must have a name 🛑'],
  },
  email: {
    type: String,
    required: [true, 'A user must have an email 🛑'],
    unique: [true, 'email is unique 🛑'],
    lowercase: true,
    validate: [validator.isEmail, 'Invalid email 🛑'],
  },
  photo: {
    type: String,
  },

  role: {
    type: String,
    enum: {
      values: ['user', 'guide', 'lead-guide', 'admin'],
      message: 'Role must be: user, guide, lead-guide, or admin 🛑',
    },
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'A user must have a password 🛑'],
    minLength: [8, 'Password must be at least 8 characters 🛑'],
    select: false,
    // validate: [validator.isStrongPassword, 'Password must be strong 🛑'],
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password 🛑'],
    validate: {
      // this only works on CREATE and SAVE !!!
      validator: function (password) {
        return password === this.password;
      },
      message: 'Passwords do not match. Please try again.',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  // hash password with cost 12
  this.password = await bcrypt.hash(this.password, 12);

  //delete the passwordConfirm field
  this.passwordConfirm = undefined;

  next();
});

userSchema.methods.correctPassword = function (
  candidatePassword,
  userPassword,
) {
  return bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changeTimesTamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );

    return JWTTimestamp < changeTimesTamp;
  }

  //false means not changed
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
