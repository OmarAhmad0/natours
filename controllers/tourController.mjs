import multer from 'multer';
import sharp from 'sharp';

import { Tour } from '../models/tourModel.mjs';
import { AppError } from '../utils/appError.mjs';
import { catchAsync } from '../utils/catchAsync.mjs';
import {
  deleteOne,
  updateOne,
  createOne,
  getOne,
  getAll,
} from './handlerFactory.mjs';


const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, callBack) => {
  if (file.mimetype.startsWith('image')) {
    callBack(null, true);
  } else {
    callBack(new AppError("Not allowed! Images only. Please try again", 400), false);
  }
};

const uploadImage = multer({ storage: multerStorage, fileFilter: multerFilter });

const uploadTourImages = uploadImage.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'image', maxCount: 3 }
]);

const resizeTourImages = catchAsync(async (req, res, next) => {

  if (!req.files.imageCover || !req.files.image) return next();

  // Cover Image
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;

  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  // Images

  req.body.image = []
  await Promise.all(
    req.files.image.map(async (file, i) => {

      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);

      req.body.image.push(filename)
    }));

  next();
})

const getAllTours = getAll(Tour);
const getTour = getOne(Tour, { path: 'reviews' });
const createTour = createOne(Tour);
const udpateTour = updateOne(Tour);
const deleteTour = deleteOne(Tour);

const aliasTopTours = function (req, res, next) {
  req.query.sort = '-ratingsAverage price';
  req.query.limit = 5;
  req.query.fields = `name ratingsAverage price summary diffculty`;
  next();
};

const getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: '$difficulty',
        numTours: { $sum: 1 },
        numRating: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $avg: '$price' },
        maxPrice: { $avg: '$price' },
      },
    },
    {
      $sort: { numTours: 1 },
    },
  ]);
  res.status(200).json({
    status: 'success',
    message: 'Tour has been arrived',
    stats,
  });
});

const getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = +req.params.year;
  const monthlyPlan = await Tour.aggregate([
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
      $addFields: { month: '$_id' },
    },
    {
      $project: { _id: 0 },
    },
    {
      $sort: { numTourStarts: -1 },
    },
  ]);
  res.status(200).json({
    status: 'success',
    results: monthlyPlan.length,
    monthlyPlan,
  });
});

const getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;

  const [lat, lng] = latlng.split(',');
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;
  if (!lat || !lng)
    return next(
      new AppError(
        'Please provide latitutr and longtude in the format lat,lng',
        400
      )
    );
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours,
    },
  });
});

const getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;
  const [lat, lng] = latlng.split(',');
  if (!lat || !lng)
    return next(
      new AppError(
        'Please provide latitutr and longtude in the format lat,lng',
        400
      )
    );
  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      data: distances,
    },
  });
});

export {
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
  uploadTourImages,
  resizeTourImages
};
