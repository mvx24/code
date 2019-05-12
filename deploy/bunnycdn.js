const https = require('https');
const path = require('path');
const dotenv = require('dotenv');

// Configure the purge using the following
const config = {
  zoneId: 0,
};

if (!config.zoneId) {
  console.error('Error: No BunnyCDN zoneId specified');
  process.exit(1);
}

// Read in .env files
dotenv.config(path.resolve(__dirname, `.env.${process.env.NODE_ENV}.local`));
dotenv.config(path.resolve(__dirname, `.env.${process.env.NODE_ENV}`));
dotenv.config(path.resolve(__dirname, `.env.local`));
dotenv.config();
if (!process.env.BUNNYCDN_ACCESS_KEY) {
  console.error('Error: No BunnyCDN credentials found in environment variables');
  process.exit(1);
}
const accessKey = process.env.BUNNYCDN_ACCESS_KEY;

function bunnyApi(endpoint, data) {
  const url = `https://bunnycdn.com/api/${endpoint}`;
  const options = {
    headers: {
      AccessKey: accessKey,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  };
  return new Promise(resolve => {
    const cb = res => {
      const { statusCode } = res;
      let error;
      if (statusCode !== 200) {
        error = new Error(`Request Failed.\nStatus Code: ${statusCode}`);
      }
      if (error) {
        console.error(error.message);
        process.exit(1);
      }
      res.setEncoding('utf8');
      let rawData = '';
      res.on('data', chunk => {
        rawData += chunk;
      });
      res.on('end', () => {
        resolve(JSON.parse(rawData));
      });
    };
    const req = data ? https.post(url, options, cb) : https.get(url, options, cb);
    req.on('error', e => {
      console.error(`Got error: ${e.message}`);
      process.exit(1);
    });
    if (data) {
      req.write(JSON.stringify(data));
      req.end();
    }
  });
}

bunnyApi(`pullzone/${config.zoneId}/purgeCache`, { id: config.zoneId }).then(result => {
  console.log('BunnyCDN Purge:');
  console.log('Result', JSON.stringify(result));
});
