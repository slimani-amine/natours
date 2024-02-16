const express = require('express');
const {
  getAllTours,
  getTour,
  updateTour,
  deleteTour,
  createTour,
} = require('../controllers/tourController');

const router = express.Router();

// router.param('id');

//create a checkBody middleware
//chekck if body contains the name and price property
//if not , send back 400 (bad request)
//add it to the post handler stack

router.route('/').get(getAllTours).post(createTour);
router.route('/:id').get(getTour).patch(updateTour).delete(deleteTour);

module.exports = router;
