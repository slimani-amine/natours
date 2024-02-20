const express = require('express');
const morgan = require('morgan');

const AppError = require('./utils/appError');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const globalErrorHandler = require('./controllers/errorController');

const app = express();

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
app.use(express.json());
app.use(express.static(`${__dirname}/public`));

app.use((req, res, next) => {
  req.requesTime = new Date().toISOString();
  next();
});

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: 404,
  //   error: ` ${req.originalUrl} Not Found! 🛑`,
  // });

  next(new AppError(` ${req.originalUrl} Not Found! 🛑`), 404);
});

app.use(globalErrorHandler);

module.exports = app;
