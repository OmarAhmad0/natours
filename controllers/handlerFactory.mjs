import { catchAsync } from '../utils/catchAsync.mjs';
import { AppError } from '../utils/appError.mjs';
import { APIFeatures } from '../utils/apiFeatures.mjs';

export const deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) {
      return next(
        new AppError(`no document found with ID = -${req.params.id}-`, 404)
      );
    }
    res.status(204).json({
      status: 'success',
      message: 'Tour has been deleted',
    });
  });

export const updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!doc) {
      return next(
        new AppError(`no document found with ID = -${req.params.id}-`, 404)
      );
    }
    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

export const createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

export const getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    const Id = req.params.id;
    let query = Model.findById(Id);
    if (popOptions) query = Model.findById(Id).populate(popOptions);

    const doc = await query;

    if (!doc) {
      return next(new AppError(`no document found with ID = -${Id}-`, 404));
    }
    res.status(200).json({
      status: 'success',
      message: `Get the document with id = {${Id}}`,
      data: { doc },
    });
  });

export const getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .peginate();

    // run query
    const docs = await features.query; //.explain();

    res.status(200).json({
      status: 'success',
      result: docs.length,
      data: {
        docs,
      },
    });
  });
