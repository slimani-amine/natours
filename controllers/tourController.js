const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const Tour = require('./../models/tourModel');
const APIFeatures = require('./../utils/apiFeatures');

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratings,price';
  req.query.fields = 'name,price,ratings,summary,diffuiculty';
  next();
};

exports.getAllTours = catchAsync(async (req, res, next) => {
  // build query
  // 1)a) filtering
  // const queryObj = { ...req.query };
  // const excludedFiels = ['page', 'sort', 'limit', 'fields'];
  // excludedFiels.forEach((el) => delete queryObj[el]);
  // console.log('🚀 ~ exports.getAllTours= ~ queryObj:', queryObj);

  // // 1)b) advanced filtering
  // let queryStr = JSON.stringify(queryObj);
  // queryStr = JSON.parse(
  //   queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`),
  // );

  // let query = Tour.find(queryStr);

  // 2) Sorting

  // if (req.query.sort) {
  //   const sortBy = req.query.sort.split(',').join(' ');
  //   query = query.sort(sortBy);
  // } else {
  //   query = query.sort('-createdAt');
  // }

  // 3) field limiting
  // if (req.query.fields) {
  //   const fields = req.query.fields.split(',').join(' ');
  //   query = query.select(fields);
  // } else {
  //   query = query.select('-__v');
  // }

  // 4 ) Pagination
  // const page = req.query.page * 1 || 1;
  // const limit = req.query.limit * 1 || 100;
  // const skip = (page - 1) * limit;

  // //page2&limit-10, 1-10 page1 , 1-2 page2 , 21-30 page3
  // query = query.skip(skip).limit(limit);
  // if (req.query.page) {
  //   const numTours = await Tour.countDocuments();
  //   if (skip >= numTours) {
  //     throw new Error('This page does not exist');
  //   }
  // }

  // execute query
  const features = new APIFeatures(Tour.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const tours = await features.query;

  //send response
  res.status(200).json({
    status: 'success ✅',
    results: tours.length,
    data: { tours },
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const tour = await Tour.findById(id);
  // const tour = await Tour.findOne({_id: id});
  if (!tour) {
    return next(new AppError('No tour found with that id', 404));
  }
  res.status(200).json({
    status: 'success ✅',
    data: { tour },
  });
});

exports.createTour = catchAsync(async (req, res, next) => {
  // const newTour = new Tour({});
  // newTour.save();
  const newTour = await Tour.create(req.body);

  res.status(201).json({
    status: 'success ✅',
    data: { tour: newTour },
  });
});

exports.updateTour = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const tour = await Tour.findByIdAndUpdate(id, req.body, { new: true });

  if (!tour) {
    return next(new AppError('No tour found with that id', 404));
  }

  res.status(200).json({
    status: 'success ✅',
    data: { tour },
  });
});

exports.deleteTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndDelete(req.params.id);

  if (!tour) {
    return next(new AppError('No tour found with that id', 404));
  }

  res.status(204).json({
    status: 'success ✅',
    data: null,
  });
});

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: {
        rating: { $gte: 4.5 },
      },
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 },
        numRatings: { $sum: '$rating' },
        avgRating: { $avg: '$rating' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: {
        avgPrice: 1,
      },
    },
    // {
    //   $match: {
    //     _id: { $ne: 'EASY' },
    //   },
    // },
  ]);

  res.status(200).json({
    status: 'success ✅',
    data: stats,
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;

  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: {
        month: '$_id',
      },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: {
        numTourStarts: -1,
      },
    },
    {
      $limit: 12,
    },
  ]);

  res.status(200).json({
    status: 'success ✅',
    data: { plan },
  });
});
