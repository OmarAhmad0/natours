import multer from 'multer';
import sharp from 'sharp';

import { User } from '../models/userModel.mjs';
import { AppError } from '../utils/appError.mjs';
import { catchAsync } from '../utils/catchAsync.mjs';

import { deleteOne, getAll, getOne, updateOne } from './handlerFactory.mjs';

// multer for photos

// old way to store a photo in disk
// const multerStorage = multer.diskStorage({
//   destination: (req, file, callBack) => {
//     callBack(null, 'public/img/users');
//   },
//   filename: (req, file, callBack) => {
//     const ext = file.mimetype.split('/')[1];
//     callBack(null, `user-${req.user.id}-${Date.now()}.${ext}`)
//   }
// });

// store a photo in memory buffer
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, callBack) => {
  if (file.mimetype.startsWith('image')) {
    callBack(null, true);
  } else {
    callBack(new AppError("Not allowed! Images only. Please try again", 400), false);
  }
};

const uploadImage = multer({ storage: multerStorage, fileFilter: multerFilter });

const uploadUserPhoto = uploadImage.single('photo');

const resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
})

const getAllUsers = getAll(User);
const getUser = getOne(User);
const updateUser = updateOne(User);
const deleteUser = deleteOne(User);

const updateMe = catchAsync(async function (req, res, next) {
  // 1) Create an error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm)
    return next(
      new AppError(
        'This route is not for password update. Please use /updateMyPassword.',
        400
      )
    );
  // 2) Update user document
  const { name, email } = req.body;
  const filteredBody = { name, email }

  if (req.file) filteredBody.photo = req.file.filename;
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    filteredBody,
    {
      new: true,
      runValidators: true,
    }
  ).select('-role');
  res.status(200).json({
    status: 'success',
    updatedUser,
  });
});
const deleteMe = catchAsync(async function (req, res, next) {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    status: 'success',
    data: null,
  });
});
const getMe = (req, res, next) => {
  req.params.id = req.user.id;

  next();
};

export {
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
  updateMe,
  deleteMe,
  getMe,
  uploadUserPhoto,
  resizeUserPhoto,
};
