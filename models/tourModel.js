const mongoose = require('mongoose');

const tourSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A tour must have a name 🛑'],
    unique: [true, "it's unique "],
    trim: true,
  },
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
  },
  rating: {
    type: Number,
    default: 4.5,
  },
  price: {
    type: Number,
    required: [true, 'A tour must have a price 🛑'],
  },
  priceDisscount: {
    type: Number,
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
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
