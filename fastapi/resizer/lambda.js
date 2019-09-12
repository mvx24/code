/**
 * To use: overwrite index.js with this and then config deploy lambda
 */
const path = require('path');
const fs = require('fs');
const https = require('https');
const AWS = require('aws-sdk');
const dotenv = require('dotenv');
const resize = require('./resize');

// Read in .env files for size configuration
dotenv.config({ path: path.resolve(__dirname, `.env.${process.env.NODE_ENV}.local`) });
dotenv.config({ path: path.resolve(__dirname, `.env.${process.env.NODE_ENV}`) });
dotenv.config({ path: path.resolve(__dirname, '.env.local') });
dotenv.config();

async function handler(event) {
  return new Promise((resolve, reject) => {
    const record = event.Records[0].s3;
    const bucket = record.bucket.name;
    const Key = decodeURIComponent(record.object.key.replace(/\+/g, ' '));

    // Download from S3 into /tmp
    const s3 = new AWS.S3({
      apiVersion: 'latest',
      params: {
        Bucket: bucket,
      },
    });
    s3.getObject({ Key }, (err, obj) => {
      if (err) {
        reject(err);
        return;
      }
      const tmpFile = path.join('/tmp', Key);
      const { webhook } = obj.Metadata;
      const webhookPost = (error, meta) => {
        if (!webhook && error) return Promise.reject(error);
        if (!webhook && meta) return Promise.resolve(meta);
        return new Promise((subresolve, subreject) => {
          const body = error
            ? JSON.stringify({ erroror: error.message })
            : JSON.stringify({ meta });
          const options = {
            Accept: 'application/json',
            headers: {},
            method: 'post',
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body),
          };
          const req = https.request(webhook, options, res => {
            const { statusCode } = res;
            if (statusCode >= 400) subreject(`Request Failed.\nStatus Code: ${statusCode}`);
            res.on('end', subresolve);
            res.on('error', subreject);
          });
          req.on('error', subreject);
          req.write(body);
          req.end();
        });
      };

      // Save the file and do the resizing
      fs.writeFile(tmpFile, obj.Body, writeErr => {
        if (writeErr) {
          reject(writeErr);
          return;
        }
        resize(tmpFile, process.env.SIZES.split(','))
          .then(meta => webhookPost(null, meta).then(resolve, reject))
          .catch(error => webhookPost(error, null).then(resolve, reject));
      });
    });
  });
}

exports.handler = handler;
