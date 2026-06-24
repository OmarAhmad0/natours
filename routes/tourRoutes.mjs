import express from 'express';
import {
  getAllTours,
  getTour,
  createTour,
  udpateTour,
  deleteTour,
  aliasTopTours,
  getTourStats,
  getMonthlyPlan,
  getToursWithin,
  getDistances,
  resizeTourImages,
  uploadTourImages,
} from '../controllers/tourController.mjs';
import { protect, restrictTo } from '../controllers/authController.mjs';
import { router as reviewRouter } from './reviewRoutes.mjs';

export const router = express.Router();
router.use('/:tourId/reviews', reviewRouter);

router
  .route('/monthly-plan/:year')
  .get(protect, restrictTo('admin', 'lead-guide', 'guide'), getMonthlyPlan);
router.route('/tour-stats').get(getTourStats);
router.route('/top-5-cheap').get(aliasTopTours, getAllTours);

router
  .route('/')
  .get(getAllTours)
  .post(protect, restrictTo('admin', 'lead-guide'), createTour);

router
  .route('/:id')
  .get(getTour)

  .patch(protect,
    restrictTo('admin', 'lead-guide'),
    uploadTourImages,
    resizeTourImages,
    udpateTour)

  .delete(protect,
    restrictTo('admin', 'lead-guide'),
    deleteTour
  );

router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(getToursWithin);

router.route('/distances/:latlng/unit/:unit').get(getDistances);
