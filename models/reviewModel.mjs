import mongoose from 'mongoose';
import { Tour } from './tourModel.mjs';
const reviewSchema = new mongoose.Schema(
  {
    review: { type: String, required: [true, 'Review can not be emty!'] },
    rating: {
      type: Number,
      max: 5,
      min: 1,
    },
    createAt: {
      type: Date,
      default: Date.now,
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a User'],
    },

    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour'],
    },
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);
//User can have only one review per tour
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });
reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name photo',
  });

  next();
});
//Next two fountions (calcAverageRatings&post middleware ) used to calc AVG rating in tour by reviews
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  // use statics method to use aggregate on the model (this)
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};
reviewSchema.post('save', function () {
  //point to curr review
  this.constructor.calcAverageRatings(this.tour);
});

//try to accsee document using findOneAnd(this targat query) and save it in this.r(r stand of review)
// and using pre before we lose the updating doc
reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.r = await this.clone().findOne();
  next();
});

reviewSchema.post(/^findOneAnd/, async function () {
  //this.r.constructor is like query.document.constructorS
  await this.r.constructor.calcAverageRatings(this.r.tour);
});

export const Review = mongoose.model('Review', reviewSchema);
