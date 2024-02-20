const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('./../../models/tourModel');

dotenv.config({
  path: './config.env',
});

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then((con) => console.log('DB connection successfull'));

// read json file
const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/tours-simple.json`, 'utf-8'),
);

// import data into DB
const importData = async () => {
  try {
    await Tour.create(tours);
    console.log('🚀 ~ Data successfully loaded!');
  } catch (error) {
    console.log('🚀 ~ importData ~ error:', error);
  }
};

// delete all data from DB
const deleteData = async () => {
  try {
    await Tour.deleteMany();
    console.log('☠️ ~ Data successfully deleted!');
    process.exit();
  } catch (error) {
    console.log('☠️ ~ deleteData ~ error:', error);
  }
};

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}
