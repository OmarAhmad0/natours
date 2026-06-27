import { config } from 'dotenv';
import express from 'express';

import { router as tourRouter } from './routes/tourRoutes.mjs';
import { router as userRouter } from './routes/userRoutes.mjs';
import { router as reviewRouter } from './routes/reviewRoutes.mjs';
import { router as viewRouter } from './routes/viewRouters.mjs';
import { router as bookingRouter } from './routes/bookingRoutes.mjs';

import morgan from 'morgan';
import { AppError } from './utils/appError.mjs';
import { globalErrorHandler } from './controllers/errorController.mjs';
import { __dirname } from './utils.mjs';
import path from 'path'

import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import ExpressMongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import hpp from 'hpp';
import cookieParser from 'cookie-parser';
import compression from 'compression'
import cors from 'cors'

export const app = express();

app.enable('trust proxy');

config({ path: './config.env' });
// set the engine for MVC
app.set("view engine", "pug");
app.set("views", path.join(__dirname, 'views'));


// Body parser, Reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }))
app.use(cookieParser());

//app.use(helmet());
app.use(cors());

app.options('*', cors())

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      fontSrc: ["'self'", 'https:', 'data:'],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'",
        'https://unpkg.com', // Greenlights Leaflet JS CDN if you use it
        'https://cdn.jsdelivr.net/npm/axios@1.16.1/dist/axios.min.js',
        'https://js.stripe.com',
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        'https://unpkg.com', // Greenlights Leaflet CSS CDN if you use it
        'https://googleapis.com'
      ],
      imgSrc: [
        "'self'",
        'data:',
        'https://*.tile.openstreetmap.org', // Greenlights OpenStreetMap layout
        'https://*.basemaps.cartocdn.com'   // Greenlights Jonas's minimalist light-grey look
      ],
      connectSrc: [
        "'self'",
        'https://api.stripe.com',
      ],
      frameSrc: [
        "'self'",
        'https://js.stripe.com' // 🔥 MANDATORY: Allows the checkout frames to mount
      ]
    }
  })
);

// 1) GLOBAL MIDDLEWARES :

// for pug have access to this folder : public
app.use(express.static(path.join(__dirname, 'public')));

// Dev Loging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
// 2) Security  Settings :

// Set Security HTTP Headers

// Limit requests number from same IP
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many request from this IP, please try again in an hour!',
});

app.use('/api', limiter);

// Data sanitization against NoSQL query injection
app.use(ExpressMongoSanitize());
// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

app.use(compression())
// 3) Routes :
app.use('/', viewRouter);

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter)

// Page not found 404
app.all('*', (req, res, next) => {
  next(new AppError(`Can not find ${req.originalUrl} on this server!`, 404));
});

// Custom Error Handler
app.use(globalErrorHandler);
