const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const AppError = require('./utils/appError');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const globalErrorHandler = require('./controllers/errorController');

const app = express();

// Global middlewares
app.use(helmet());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP,please try again in an hour',
});

app.use('/api', limiter);

// body parser
app.use(express.json({ limit: '10kb' }));

// data sanitization against NoSql query injection
app.use(mongoSanitize());

// data sanitization against XSS
app.use(xss());

// dPrevent parameter pollution
app.use(
  hpp({
    whitelist: ['duration', 'ratings', 'maxGroupSize', 'difficulty', 'price'],
  }),
);

app.use(express.static(`${__dirname}/public`));

app.use((req, res, next) => {
  req.requesTime = new Date().toISOString();
  next();
});

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: 404,
  //   error: ` ${req.originalUrl} Not Found! 🛑`,
  // });

  next(new AppError(` ${req.originalUrl} Not Found! 🛑`), 404);
});

app.use(globalErrorHandler);

module.exports = app;
