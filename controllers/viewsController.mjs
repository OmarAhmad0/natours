import { Tour } from '../models/tourModel.mjs';
import { Booking } from '../models/bookingModel.mjs';
import { catchAsync } from '../utils/catchAsync.mjs';
import { AppError } from '../utils/appError.mjs';

const getOverview = catchAsync(async (req, res, next) => {

  const tours = await Tour.find();
  if (!tours) return next(new AppError('There is no tours', 404))
  res.status(200).render('overview', {
    title: 'All Tours',
    tours
  });
});

const getTour = catchAsync(async (req, res, next) => {
  const slug = req.params.slug;


  const tour = await Tour.findOne({ slug: slug }).populate({
    path: 'reviews',
    fields: 'review rating user'
  });


  if (!tour) {
    return next(new AppError('There is no tour with this name', 404));
  }

  res.status(200).render('tour', {
    title: `${tour.name}`,
    tour
  });
});



const getLoginFrom = catchAsync(async (req, res, next) => {

  res.status(200).render('login', {
    title: 'Log into your account'
  });
});


const getAccount = catchAsync(async (req, res, next) => {
  //const user = await User.findById();
  res.status(200).render('account', {
    title: 'Your Account Setting',
    user: res.locals.user
  });
});

//remove later

// const updateUserDate = catchAsync(async (req, res, next) => {


//   const updaedUser = await User.findByIdAndUpdate(req.user.id,
//     {
//       name: req.body.name,
//       email: req.body.email
//     },
//     {
//       new: true,
//       runValidators: true
//     });

//   res.status(200).render('account', {
//     title: 'Your Account Setting',
//     user: updaedUser
//   });

// });
const getMyTours = catchAsync(async (req, res, next) => {

  const bookings = await Booking.find({ user: req.user.id });

  const tourIDs = bookings.map(el => el.tour);

  const tours = await Tour.find({ _id: { $in: tourIDs } });

  res.status(200).render('overview', {
    title: `My Tours`,
    tours
  });

})

const getSignUpFrom = catchAsync(async (req, res, next) => {

  res.status(200).render('signup', {
    title: 'Sign Up'
  });
});

const alerts = (req, res, next) => {
  const { alert } = req.query;
  if (alert === 'booking') {
    res.locals.alert = `Your booking was successful! Pleas check your Email for a confirmation.
    \nif your booking dose not show up here immediatly, please come back later.`
    next();
  }
}
export { getOverview, getTour, getLoginFrom, getAccount, getMyTours, getSignUpFrom, alerts };