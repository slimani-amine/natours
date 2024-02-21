const Review = require('../models/reviewModal');
const factory = require('./handlerFactory');

exports.getAllReviews = factory.getAll(Review);

exports.setTourUserIds = (req, res, next) => {
  //allow nested routes to
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

exports.getReview = factory.getOne(Review);
exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
