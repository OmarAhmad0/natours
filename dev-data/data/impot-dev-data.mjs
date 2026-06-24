import mongoose from 'mongoose';
import { config } from 'dotenv';
import { readFileSync } from 'fs';

import { Tour } from '../../models/tourModel.mjs';
import { User } from '../../models/userModel.mjs';
import { Review } from '../../models/reviewModel.mjs';
import { __dirname } from '../../utils.mjs';

config({ path: './config.env' });

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

const conn = await mongoose.connect(DB);
console.log('connecting to database...');

const tours = JSON.parse(
  readFileSync(`${__dirname}/dev-data/data/tours.json`, 'utf-8')
);
const users = JSON.parse(
  readFileSync(`${__dirname}/dev-data/data/users.json`, 'utf-8')
);
const reviews = JSON.parse(
  readFileSync(`${__dirname}/dev-data/data/reviews.json`, 'utf-8')
);

export const importData = async function () {
  try {
   // await Tour.create(tours);
    await User.create(users, { validateBeforeSave: false });
   // await Review.create(reviews);
    console.log('data has been loaded to database');
  } catch (error) {
    console.log(error);
  }
  process.exit();
};
export const deleteData = async function () {
  try {
   // await Tour.deleteMany();
    await User.deleteMany();
   // await Review.deleteMany();
    console.log('data has been deleted');
  } catch (error) {
    console.log(error);
  }
  process.exit();
};

if (process.argv[2] === '--delete') deleteData();
else if (process.argv[2] === '--import') importData();
