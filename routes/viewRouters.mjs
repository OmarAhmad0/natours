import express from 'express';
import { getOverview, getTour, getLoginFrom, getAccount, getMyTours, getSignUpFrom, alerts } from '../controllers/viewsController.mjs';
import { isLoggedIn, protect } from '../controllers/authController.mjs';

const router = express.Router();

router.use(alerts);

router.get('/', isLoggedIn, getOverview);
router.get('/login', isLoggedIn, getLoginFrom);
router.get('/tour/:slug', isLoggedIn, getTour);
router.get('/me', protect, getAccount);
router.get('/my-tours', protect, getMyTours)

router.get('/signup', getSignUpFrom);


export { router }