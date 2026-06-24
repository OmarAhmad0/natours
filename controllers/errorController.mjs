import { AppError } from '../utils/appError.mjs';

const sendErrorDev = function (err,req, res) {
  if(req.originalUrl.startsWith('/api')){
   return res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
  }

  return  res.status(err.statusCode).render('error' ,{
      title : 'Something went wrong!',
      message: err.message
    })
  };

const sendErrorProd = function (err,req, res) {
  if(req.originalUrl.startsWith('/api')){
    if (err.isOperational) {
     return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } 
    console.error('ERROR!!', err);
   return res.status(500).json({
      status: 'Error',
      message: 'Please try again later' ,
    });
  
} 
  if(err.isOperational){
     return res.status(err.statusCode).render('error' ,{
      title : 'Error' ,
      message: err.message
    })
}
  console.log("ERROR",err);
 return res.status(err.statusCode).render('error',{
    title : 'Error',
    message : 'Please try again later!!' 
  })

};

const handleCastErrorDB = function (error) {
  const message = `Invalid ${error.path} : ${error.value}`;
  return new AppError(message, 400);
};
const handleDuplicatFieldsDB = function (error) {
  const message = `Duplicate field value: ${error.keyValue.name}. Please use another value!`;
  return new AppError(message, 400);
};
const handleValidatorErrorDB = function (error) {
  const err = Object.values(error.errors).map((el) => el.message);
  const message = `Invalid input data${err.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = function () {
  const message = `Invalid token. Please log in again!`;
  return new AppError(message, 401);
};

const handleExpiredToken = function () {
  const message = `Your token has beed expired. Please log in again!`;
  return new AppError(message, 401);
};

export const globalErrorHandler = function (err, req, res, next) {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err,req, res);
  } else if (process.env.NODE_ENV === 'production') {
    if (err.name === 'CastError') {
      err = handleCastErrorDB(err);
    }

    if (err.code === 11000) {
      err = handleDuplicatFieldsDB(err);
    }

    if (err.name === 'ValidationError') {
      err = handleValidatorErrorDB(err);
    }

    if (err.name === 'JsonWebTokenError') {
      err = handleJWTError();
    }

    if (err.name === 'TokenExpiredError') {
      err = handleExpiredToken();
    }
    sendErrorProd(err,req, res);
  }

  next();
};
