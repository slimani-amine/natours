const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'A review must have a rating 🛑'],
    },
    rating: {
      type: Number,
      required: [true, 'A review must have a rating 🛑'],
      min: [1, 'Rating must be above 1.0 🛑'],
      max: [5, 'Rating must be below 5.0 🛑'],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'A review must have a tour 🛑'],
    },
    user: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'A review must have a user 🛑'],
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name photo',
  });
  next();
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
