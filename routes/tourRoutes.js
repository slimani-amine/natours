const express = require('express');
const {
  getAllTours,
  getTour,
  updateTour,
  deleteTour,
  createTour,
  aliasTopTours,
  getTourStats,
  getMonthlyPlan,
} = require('../controllers/tourController');
const authController = require('./../controllers/authController');
const reviewRouter = require('./reviewRoutes');

const router = express.Router();

router.route('/tour-stats').get(getTourStats);
router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    getMonthlyPlan,
  );

router.route('/top-5-cheap').get(aliasTopTours, getAllTours);

router
  .route('/')
  .get(getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    createTour,
  );
router
  .route('/:id')
  .get(getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    updateTour,
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    deleteTour,
  );

router.use('/:tourId/reviews', reviewRouter);

module.exports = router;
