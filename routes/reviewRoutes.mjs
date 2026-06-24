import express from 'express';
import {
  getAllReview,
  createReview,
  deleteReview,
  updateReview,
  setTourUserIds,
  getReview,
} from '../controllers/reviewController.mjs';
import { protect, restrictTo } from '../controllers/authController.mjs';
export const router = express.Router({ mergeParams: true });

router.use(protect);

router
  .route('/')
  .get(getAllReview)
  .post(protect, restrictTo('user'), setTourUserIds, createReview);

router
  .route('/:id')
  .delete(restrictTo('user', 'admin'), deleteReview)
  .patch(restrictTo('user', 'admin'), updateReview)
  .get(getReview);
