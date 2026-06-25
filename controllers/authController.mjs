import { User } from '../models/userModel.mjs';
import { AppError } from '../utils/appError.mjs';
import { catchAsync } from '../utils/catchAsync.mjs';
// import email from '../utils/email.mjs';
import { Email } from '../utils/email.mjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { promisify } from 'util';


// old code for sign in using access token (long-lived)
// const signToken = function (id) {
//   return jwt.sign({ id }, process.env.JWT_SECRET, {
//     expiresIn: process.env.JWT_EXPIRES_IN,
//   });
// };

// const createSendToken_old_withoutRefreshToken = function (res, user, statusCode) {
//   const token = signToken(user._id);
//   const cookieOptions = {
//     expires: new Date(
//       Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
//     ),
//     httpOnly: true,
//   };
//   if (process.env.NODE_ENVv === 'production') cookieOptions.secure = true;
//   res.cookie('jwt', token, cookieOptions);
//   user.password = undefined;
//   return res.status(statusCode).json({
//     status: 'success',
//     token,
//     user,
//   });
// };

const signAccessToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN // e.g., 15m
  });
};

const signRefreshToken = id => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN // e.g., 30d
  });
};

const createSendToken = async function (user, statusCode, req, res) {
  // 1) Generate both tokens
  const accessToken = signAccessToken(user._id);
  const refreshToken = signRefreshToken(user._id);

  // 2) Save the new refresh token to the user's array in the database
  user.refreshTokens.push(refreshToken);

  // Use findByIdAndUpdate to bypass validation paths that require passwords
  await User.findByIdAndUpdate(user._id, { refreshTokens: user.refreshTokens });

  const isProduction = process.env.NODE_ENV === 'production';

  // 3) Setup Cookie Options for the Access Token
  const accessTokenCookieOptions = {
    expires: new Date(
      Date.now() + parseInt(process.env.JWT_COOKIE_EXPIRES_IN, 10)
    ),
    httpOnly: true,
    secure: isProduction || req.secure || req.headers['x-forwarded-proto'] === 'https'
  };

  // 4) Setup Cookie Options for the Refresh Token
  const refreshTokenCookieOptions = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 Days also matches JWT_REFRESH_EXPIRES_IN
    httpOnly: true,
    secure: isProduction || req.secure || req.headers['x-forwarded-proto'] === 'https'
  };

  //if (process.env.NODE_ENV === 'production') accessTokenCookieOptions.secure = true;

  // 5) Send cookies to the browser
  res.cookie('jwt', accessToken, accessTokenCookieOptions);
  res.cookie('refreshToken', refreshToken, refreshTokenCookieOptions);

  user.password = undefined;

  return res.status(statusCode).json({
    status: 'success',
    accessToken,
    user,
  });
};

const refreshToken = catchAsync(async (req, res, next) => {
  // 1) Get refresh token from cookies
  const token = req.cookies.refreshToken;

  if (!token) {
    return next(new AppError('No refresh token found. Please log in again.', 401));
  }

  // 2) Verify the refresh token's signature and expiration
  let decoded;
  try {
    decoded = await promisify(jwt.verify)(token, process.env.JWT_REFRESH_SECRET);
  } catch (err) {
    return next(new AppError('Invalid or expired refresh token. Please log in again.', 401));
  }

  // 3) Check if the user still exists in the database
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError('The user belonging to this token no longer exists.', 401));
  }

  // 4) Check if this specific refresh token is still whitelisted/active for this user
  if (!currentUser.refreshTokens.includes(token)) {
    return next(new AppError('This token has been revoked or tampered with. Please log in again.', 401));
  }

  // 5) Everything checks out! Issue a brand-new short-lived Access Token
  const newAccessToken = signAccessToken(currentUser._id);

  // 6) Send the new access token down via a fresh cookie
  const accessTokenCookieOptions = {
    expires: new Date(Date.now() + parseFloat(process.env.JWT_COOKIE_EXPIRES_IN, 10)),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' || req.secure || req.headers['x-forwarded-proto'] === 'https'
  };

  res.cookie('jwt', newAccessToken, accessTokenCookieOptions);

  // 7) Send JSON response back to the client
  res.status(200).json({
    status: 'success',
    accessToken: newAccessToken
  });
});


// End points APIs

const signup = catchAsync(async function (req, res, next) {

  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });
  // const url = `${req.protocol}://${req.get('host')}/me`

  const protocol = req.protocol;
  const host = req.get('host');
  const url = `${protocol}://${host}/me`;

  //await new Email(newUser, url).sendWelcome();

  //new Email(newUser, url).sendWelcome().catch(err => console.error('Email failed to send in background:', err));

  //  FIRE AND FORGET (Safe Background Task)
  // We don't await this, so the code below runs instantly!
  (async () => {
    try {
      await new Email(newUser, url).sendWelcome();
      // console.log(`✨ Welcome email successfully sent to ${newUser.email}`);
    } catch (err) {
      // Handle the background error safely without crashing the main thread
      console.error('🚨 BACKGROUND EMAIL FAILURE:', err.message);
      // Optional: Send this log to an external tracking tool like Sentry
    }
  })(); // The () at the end executes this block immediately in the background
  createSendToken(newUser, 201, req, res);
});

const login = catchAsync(async function (req, res, next) {
  //await User.syncIndexes();
  const { email, password } = req.body;
  // 1) Check if email and password exist
  if (!email || !password)
    return next(new AppError('Please provide email and password!', 400));

  // 2) Check if user email && password are correct
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password)))
    return next(new AppError('email or password are incorrect', 401));

  // 3) send jwt token
  createSendToken(user, 200, req, res);
});

const logout = function (req, res) {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  // Clear the long-lived refresh token too!
  res.cookie('refreshToken', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  return res.status(200).json({
    status: 'success'
  });
}
// old version
// const protect = catchAsync(async function (req, res, next) {
//   // 1) Getting token and check of it is there
//   let token;
//   if (
//     req.headers.authorization &&
//     req.headers.authorization.startsWith('Bearer')
//   ) {
//     token = req.headers.authorization.split(' ')[1];
//   } else if (req.cookies.jwt) {
//     token = req.cookies.jwt;
//   }

//   if (!token)
//     return next(
//       new AppError('You are not logged in! Please log in to get access.', 401)
//     );
//   // 2) Verification token
//   let decoded;
//   try {
//     decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

//   } catch (error) {
//     return next(new AppError('Your access token has expired or is invalid.', 401));
//   }

//   // 3) Check if user still exists
//   const currentUser = await User.findById(decoded.id);
//   if (!currentUser) return next(new AppError('user is no longer exist', 401));

//   // 4) Check if user changed password after the token was issued
//   if (currentUser.changedPasswordAfter(decoded.iat)) {
//     return next(
//       new AppError('User recnetly changed password! Please log in again.', 401)
//     );
//   }
//   //Grant access to protected route
//   req.user = currentUser;
//   res.locals.user = currentUser;
//   next();
// });

const protect = catchAsync(async function (req, res, next) {
  // 1) Get the token (from headers or cookies)
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  // 2) Try to verify the short-lived Access Token
  if (token) {
    try {
      const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
      const currentUser = await User.findById(decoded.id);

      if (!currentUser) return next(new AppError('The user belonging to this token no longer exists.', 401));
      if (currentUser.changedPasswordAfter(decoded.iat)) return next(new AppError('User recently changed password! Please log in again.', 401));

      // Token is valid! Grant access.
      req.user = currentUser;
      res.locals.user = currentUser;
      return next();
    } catch (error) {
      // Access token is expired/invalid! 
      // Do nothing here, just let it fall through to the Refresh Token check below.
    }
  }

  // 3) RESCUE OPERATION: If the Access Token is missing or expired, check the Refresh Token!
  if (req.cookies.refreshToken) {
    try {
      const decodedRefresh = await promisify(jwt.verify)(req.cookies.refreshToken, process.env.JWT_REFRESH_SECRET);
      const currentUser = await User.findById(decodedRefresh.id);

      if (currentUser && currentUser.refreshTokens.includes(req.cookies.refreshToken)) {
        // Rescue successful! Issue a brand new Access Token
        const newAccessToken = signAccessToken(currentUser._id);

        const accessTokenCookieOptions = {
          expires: new Date(Date.now() + parseInt(process.env.JWT_COOKIE_EXPIRES_IN, 10)),
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production' || req.secure || req.headers['x-forwarded-proto'] === 'https'
        };

        // Drop the new cookie into the browser
        res.cookie('jwt', newAccessToken, accessTokenCookieOptions);

        // Grant access to the protected route smoothly
        req.user = currentUser;
        res.locals.user = currentUser;
        return next();
      }
    } catch (refreshErr) {
      // Refresh token is also dead or tampered with.
    }
  }

  // 4) If we reach this line, BOTH tokens failed or are missing. Kick them out!
  return next(new AppError('You are not logged in! Please log in to get access.', 401));
});
const isLoggedIn = catchAsync(async function (req, res, next) {
  const token = req.cookies.jwt;

  if (token) {
    try {
      // 1. Verify the token safely
      const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

      // 2. Check if the user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) return next();

      // 3. Check if user changed password after the token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // 4. THERE IS A LOGGED IN USER! Expose user data to Pug templates
      res.locals.user = currentUser;
      return next();
    }
    catch (err) {

    }
  }

  if (req.cookies.refreshToken) {
    try {
      console.log("Attempting to rescue session with Refresh Token...");

      const decodedRefresh = await promisify(jwt.verify)(req.cookies.refreshToken, process.env.JWT_REFRESH_SECRET);
      const currentUser = await User.findById(decodedRefresh.id);

      if (currentUser && currentUser.refreshTokens.includes(req.cookies.refreshToken)) {

        console.log("Rescue successful! Issuing new Access Token.");
        const newAccessToken = signAccessToken(currentUser._id);

        // 🔥 FIXED: Pure integer math, no multiplication!
        const accessTokenCookieOptions = {
          expires: new Date(Date.now() + parseInt(process.env.JWT_COOKIE_EXPIRES_IN, 10)),
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production' || req.secure || req.headers['x-forwarded-proto'] === 'https'
        };

        res.cookie('jwt', newAccessToken, accessTokenCookieOptions);

        res.locals.user = currentUser;
        req.user = currentUser;
        return next();
      }
    } catch (refreshErr) {
      // Refresh token is dead/tampered with. Fall through to log out.
      console.log("Refresh token failed.");
    }
  }

  next();
});

const restrictTo = function (...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role))
      return next(new AppError('Access denied', 403));
    next();
  };
};

const forgotPassword = catchAsync(async function (req, res, next) {
  // 1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) return next(new AppError('There is no user with this email', 404));
  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) send it back as email
  try {

    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/user/resetPassword/${resetToken}`;

    new Email(user, resetURL).sendResetPassword();
    res.status(200).json({
      status: 'success',
      message: 'Token sent to email',
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError('There was an error sending the email. Try again later', 500)
    );
  }
});

const resetPassword = catchAsync(async function (req, res, next) {
  // 1) Get user based on the token
  // console.log("Enter ResetPassword")
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  // console.log(hashedToken, user)
  // 2) If token has not expired, and there is user, set the new password
  if (!user) return next(new AppError('Token is invalid or has expired', 400));
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;

  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  // 3) Update changedPasswordAt property for the user
  await user.save();
  // 4) Log the user in, send JWT
  createSendToken(user, 200, req, res);
});

const updatePassword = catchAsync(async function (req, res, next) {
  // 1) Get user from collection
  const { passwordCurrent, password, passwordConfirm } = req.body;
  const user = await User.findById(req.user._id).select('+password');
  if (!user) return next(new AppError('You are not log in!!', 400));
  // 2) Check if POSTed current passwprd is correct
  if (!(await user.correctPassword(passwordCurrent, user.password))) {
    return next(new AppError('Your current password is not correct!', 401));
  }

  // 3) If so. update password
  user.password = password;
  user.passwordConfirm = passwordConfirm;
  await user.save();

  // 4) Log user in, Send JWT token
  createSendToken(user, 200, req, res);
});

export {
  signup,
  login,
  protect,
  restrictTo,
  forgotPassword,
  resetPassword,
  updatePassword,
  isLoggedIn,
  logout,
  refreshToken,
};
