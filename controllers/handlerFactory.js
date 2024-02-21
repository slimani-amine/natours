const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const APIFeatures = require('./../utils/apiFeatures');

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError(`No document found with that id`, 404));
    }

    res.status(204).json({
      status: 'success ✅',
      data: null,
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const id = req.params.id;
    const doc = await Model.findByIdAndUpdate(id, req.body, { new: true });

    if (!doc) {
      return next(new AppError('No document found with that id', 404));
    }

    res.status(200).json({
      status: 'success ✅',
      data: { data: doc },
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    // const newTour = new Tour({});
    // newTour.save();
    const doc = await Model.create(req.body);

    res.status(201).json({
      status: 'success ✅',
      data: { data: doc },
    });
  });

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    const id = req.params.id;
    let query = Model.findById(id);
    if (popOptions) {
      query = query.populate(popOptions);
    }
    const doc = await query;

    if (!doc) {
      return next(new AppError('No document found with that id', 404));
    }

    res.status(200).json({
      status: 'success ✅',
      data: { data: doc },
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    //to allow for nested GET reviews on tour (hack)
    let filter = {};
    if (req.params.tourId) {
      filter = {
        tour: req.params.tourId,
      };
    }

    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const doc = await features.query;

    res.status(200).json({
      status: 'success ✅',
      results: doc.length,
      data: { data: doc },
    });
  });
