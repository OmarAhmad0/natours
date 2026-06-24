import express from 'express';

import {
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
  updateMe,
  deleteMe,
  getMe,
  uploadUserPhoto,
  resizeUserPhoto,
} from '../controllers/userController.mjs';
import {
  login,
  signup,
  forgotPassword,
  updatePassword,
  protect,
  restrictTo,
  logout,
  resetPassword,
  refreshToken,
} from '../controllers/authController.mjs';


export const router = express.Router();
// Users API
router.get('/me', protect, getMe, getUser);

router.post('/signup', signup);
router.post('/login', login);
router.get('/logout', logout);

router.post('/refreshToken', refreshToken);

router.post('/forgotPassword', forgotPassword);
router.patch('/resetPassword/:token', resetPassword);

// Protect All Route After This Middleware
router.use(protect);

router.patch('/updateMyPassword', updatePassword);

router.patch('/updateMe', uploadUserPhoto, resizeUserPhoto, updateMe);
router.delete('/deleteMe', deleteMe);

//Only Admin Can Use These Routes
router.use(restrictTo('admin'));

router.route('/').get(getAllUsers);
router.route('/:id').get(getUser).patch(updateUser).delete(deleteUser);
