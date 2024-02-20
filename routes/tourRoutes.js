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

const router = express.Router();

router.route('/tour-stats').get(getTourStats);
router.route('/monthly-plan/:year').get(getMonthlyPlan);

router.route('/top-5-cheap').get(aliasTopTours, getAllTours);

router.route('/').get(authController.protect, getAllTours).post(createTour);
router
  .route('/:id')
  .get(getTour)
  .patch(updateTour)
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    deleteTour,
  );

module.exports = router;
