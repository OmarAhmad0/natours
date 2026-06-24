import { Review } from '../models/reviewModel.mjs';
//import { catchAsync } from '../utils/catchAsync.mjs';
import {
  deleteOne,
  createOne,
  updateOne,
  getOne,
  getAll,
} from './handlerFactory.mjs';

const getAllReview = getAll(Review);
const getReview = getOne(Review);
const createReview = createOne(Review);
const updateReview = updateOne(Review);
const deleteReview = deleteOne(Review);

const setTourUserIds = function (req, res, next) {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

export {
  getAllReview,
  createReview,
  deleteReview,
  updateReview,
  setTourUserIds,
  getReview,
};
