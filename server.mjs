import dns from 'node:dns';
dns.setServers(['1.1.1.1', '8.8.8.8']);

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

process.on('SIGTERM', () => {
  console.log('👋 SIGTERM RECEIVED. Shutting down gracefully...');

  // 1. Stop accepting new requests
  server.close(() => {
    console.log('💥 Process terminated!');
    // 2. Safely close database connections (Mongoose/MongoDB) here if needed
  });
});