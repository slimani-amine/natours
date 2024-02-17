const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name 🛑'],
      unique: [true, "it's unique "],
      trim: true,
      maxLength: [
        250,
        'A tour name must have less or equal then 40 characters 🛑',
      ],
      minLength: [
        10,
        'A tour name must have more or equal then 10 characters 🛑',
      ],
      // validate: [validator.isAlpha, 'The name must only contain characters 🛑'],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration 🛑'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size 🛑'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty 🛑'],
      enum: {
        values: ['easy', 'meduim', 'difficult'],
        message: 'Difficulty is either: easy, meduim or fifficult 🛑',
      },
    },
    ratings: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0 🛑'],
      max: [5, 'Rating must be below 5.0 🛑'],
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price 🛑'],
    },
    priceDisscount: {
      type: Number,
      validate: {
        validator: function (val) {
          return val < this.price;
        },
        message: 'Discount price should be below the regular price 🛑',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a summary'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

//Document middleware runs before .save() and .create()
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// tourSchema.pre('save', function (next) {
//   console.log('will save documents...');
//   next();
// });

// tourSchema.post('save', function (doc, next) {
//   console.log(doc);
//   next();
// });

tourSchema.pre(/^find/, function (next) {
  this.find({
    secretTour: { $ne: true },
  });

  this.start = Date.now();
  next();
});

tourSchema.post(/^find/, function (docs, next) {
  console.log(`Query took ${Date.now() - this.start}ms`);
  next();
});

// aggregation middleware
tourSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });

  next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
