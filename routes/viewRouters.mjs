import express from 'express';
import { getOverview, getTour, getLoginFrom, getAccount, getMyTours, getSignUpFrom } from '../controllers/viewsController.mjs';
import { isLoggedIn, protect } from '../controllers/authController.mjs';
import { createBookingCheckout } from '../controllers/bookingController.mjs';

const router = express.Router();



router.get('/', createBookingCheckout, isLoggedIn, getOverview);
router.get('/login', isLoggedIn, getLoginFrom);
router.get('/tour/:slug', isLoggedIn, getTour);
router.get('/me', protect, getAccount);
router.get('/my-tours', protect, getMyTours)

router.get('/signup', getSignUpFrom);

// renove later
// router.post('/submit-user-data',protect, updateUserDate);


export { router }