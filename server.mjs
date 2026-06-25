import mongoose from 'mongoose';
import { config } from 'dotenv';
import { app } from './app.mjs';

//import { deleteData, importData } from './dev-data/data/impot-dev-data.mjs';
config({ path: './config.env' });

export const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);
if (await mongoose.connect(DB)) console.log('connecting to database...');

const port = process.env.PORT || 8000;

const server = app.listen(port, () => {
  console.log(`App running on port ${port}`);
  //importData();
  //deleteData();
});


process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('Unhandled Rejection! Shutting down...');
  server.close(() => {
    process.exit(1);
  });
});

process.on('uncaughtException', (err) => {
  console.log(err.name, err.message);
  console.log('Uncaught Exception! Shutting down...');
  server.close(() => {
    process.exit(1);
  });
});

