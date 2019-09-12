#!/usr/bin/env node
const path = require('path');
const dotenv = require('dotenv');
const resize = require('./resize');

if (!process.argv[2]) {
  console.error('No input file specified.');
  process.exit(1);
}

const inputPath = path.resolve(process.argv[2]);
const sizes = process.argv.slice(3);

// Read in .env files for size configuration
dotenv.config({ path: path.resolve(__dirname, `.env.${process.env.NODE_ENV}.local`) });
dotenv.config({ path: path.resolve(__dirname, `.env.${process.env.NODE_ENV}`) });
dotenv.config({ path: path.resolve(__dirname, '.env.local') });
dotenv.config();

resize(inputPath, sizes.length ? sizes : process.env.SIZES.split(','))
  .then(meta => {
    console.log(JSON.stringify(meta));
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
