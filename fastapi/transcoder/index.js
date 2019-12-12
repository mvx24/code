#!/usr/bin/env node
const path = require('path');
const dotenv = require('dotenv');
const transcode = require('./transcode');

const [, , inputFile] = process.argv;

if (!inputFile) {
  console.error('No input file specified.');
  process.exit(1);
}

// Read in .env files for size configuration
dotenv.config({ path: path.resolve(__dirname, `.env.${process.env.NODE_ENV}.local`) });
dotenv.config({ path: path.resolve(__dirname, `.env.${process.env.NODE_ENV}`) });
dotenv.config({ path: path.resolve(__dirname, '.env.local') });
dotenv.config();
process.env.SIZES = process.env.SIZES || '';

if (inputFile === 'server') {
  require('./server');
} else {
  const inputPath = path.resolve(inputFile);
  const sizes = process.argv.length > 3 ? process.argv.slice(3) : process.env.SIZES.split(',');

  transcode(inputPath, sizes)
    .then(results => {
      console.log(JSON.stringify(results));
    })
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
