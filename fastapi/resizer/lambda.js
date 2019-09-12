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
    s3.getObject({ Key }, (err, res) => {
      if (err) {
        reject(err);
        return;
      }
      const tmpFile = path.join('/tmp', Key);
      const { webhook } = res.Metadata;
      const webhookPost = (err, meta) => {
        if (!webhook && err) return Promise.reject(err);
        if (!webhook && meta) return Promise.resolve(meta);
        return new Promise((resolve, reject) => {
          const body = err ? JSON.stringify({ error: err.message }) : JSON.stringify({ meta });
          const options = {
            Accept: 'application/json',
            headers: {},
            method: 'post',
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body),
          };
          const req = https.request(webhook, options, res => {
            const { statusCode } = res;
            if (statusCode >= 400) reject(`Request Failed.\nStatus Code: ${statusCode}`);
            res.on('end', resolve);
            res.on('error', reject);
          });
          req.on('error', reject);
          req.write(body);
          req.end();
        });
      };

      // Save the file and do the resizing
      fs.writeFile(tmpFile, res.Body, err => {
        if (err) {
          reject(err);
          return;
        }
        resize(tmpFile, process.env.SIZES.split(','))
          .then(meta => webhookPost(null, meta).then(resolve, reject))
          .catch(err => webhookPost(err, null).then(resolve, reject));
      });
    });
  });
}

exports.handler = handler;
