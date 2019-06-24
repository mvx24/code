const path = require('path');
const dotenv = require('dotenv');
const MaxCDN = require('maxcdn');

// Configure the purge using the following
const config = {
  companyAlias: '',
  zoneId: '',
};

const error = msg => {
  console.error(['\033[1;31m', 'Error: ', msg, '\033[0m'].join(''));
  process.exit(1);
};


// Read in .env files
dotenv.config(path.resolve(__dirname, `.env.${process.env.NODE_ENV}.local`));
dotenv.config(path.resolve(__dirname, `.env.${process.env.NODE_ENV}`));
dotenv.config(path.resolve(__dirname, `.env.local`));
dotenv.config();

if (!config.companyAlias || !config.zoneId) error('No MaxCDN companyAlias or zoneId specified');
if (!process.env.MAXCDN_CONSUMER_KEY || !process.env.MAXCDN_CONSUMER_SECRET) {
  error('No MaxCDN credentials found in environment variables');
}

const consumerKey = process.env.MAXCDN_CONSUMER_KEY;
const consumerSecret = process.env.MAXCDN_CONSUMER_SECRET;
const maxcdn = new MaxCDN(config.companyAlias, consumerKey, consumerSecret);
maxcdn.del(`zones/pull.json/${config.zoneId}/cache`, (err, result) => {
  console.log('MaxCDN Purge:');
  if (err) error(err);
  console.log('\u{1f680}  Result', result);
});
