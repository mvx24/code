const path = require('path');
const dotenv = require('dotenv');
const MaxCDN = require('maxcdn');

// Configure the purge using the following
const config = {
  companyAlias: '',
  zoneId: '',
};

if (!config.companyAlias || !config.zoneId) {
  console.error('Error: No MaxCDN companyAlias or zoneId specified');
  process.exit(1);
}

// Read in .env files
dotenv.config(path.resolve(__dirname, `.env.${process.env.NODE_ENV}.local`));
dotenv.config(path.resolve(__dirname, `.env.${process.env.NODE_ENV}`));
dotenv.config(path.resolve(__dirname, `.env.local`));
dotenv.config();
if (!process.env.MAXCDN_CONSUMER_KEY || !process.env.MAXCDN_CONSUMER_SECRET) {
  console.error('Error: No MaxCDN credentials found in environment variables');
  process.exit(1);
}

const consumerKey = process.env.MAXCDN_CONSUMER_KEY;
const consumerSecret = process.env.MAXCDN_CONSUMER_SECRET;
const maxcdn = new MaxCDN(config.companyAlias, consumerKey, consumerSecret);
maxcdn.del(`zones/pull.json/${config.zoneId}/cache`, (err, result) => {
  console.log('MaxCDN Purge:');

  if (err) {
    console.trace(err);
    return;
  }

  console.log('Result', result);
});
