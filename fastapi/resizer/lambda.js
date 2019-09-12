/**
 * To use:
 * overwrite index.js with this
 * yarn add aws-sdk mime
 * config deploy lambda
 * Be sure to set SIZES and MEDIA_BUCKET env variables
 */
const path = require('path');
const fs = require('fs');
const https = require('https');
const AWS = require('aws-sdk');
const mime = require('mime');
const dotenv = require('dotenv');
const resize = require('./resize');

// Read in .env files for size configuration
dotenv.config({ path: path.resolve(__dirname, `.env.${process.env.NODE_ENV}.local`) });
dotenv.config({ path: path.resolve(__dirname, `.env.${process.env.NODE_ENV}`) });
dotenv.config({ path: path.resolve(__dirname, '.env.local') });
dotenv.config();
process.env.SIZES = process.env.SIZES || '';

function webhookPost(webhook, err, metadata) {
  if (!webhook && err) return Promise.reject(err);
  if (!webhook && metadata) return Promise.resolve(metadata);
  return new Promise((resolve, reject) => {
    const body = err ? JSON.stringify({ error: err.message }) : JSON.stringify({ metadata });
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
}

function s3Put(s3, key, file) {
  return new Promise((resolve, reject) => {
    const base = path.basename(file);
    fs.readFile(file, (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      s3.putObject(
        {
          Key: `/${key}/${base.substr(0, 2)}/${base.substr(2, 2)}/${base.substr(4, 2)}/${base}`,
          Body: data,
          CacheControl: 'no-cache',
          ContentType: mime.getType(base),
        },
        s3err => {
          if (s3err) {
            reject(s3err);
            return;
          }
          resolve();
        },
      );
    });
  });
}

async function handler(event) {
  return new Promise((resolve, reject) => {
    const record = event.Records[0].s3;
    const bucket = record.bucket.name;
    const Key = decodeURIComponent(record.object.key.replace(/\+/g, ' '));
    const s3Staging = new AWS.S3({
      apiVersion: 'latest',
      params: {
        Bucket: bucket,
      },
    });
    const s3Media = new AWS.S3({
      apiVersion: 'latest',
      params: {
        Bucket: process.env.MEDIA_BUCKET,
      },
    });

    // Download from S3 into /tmp
    s3Staging.getObject({ Key }, (s3err, res) => {
      if (s3err) {
        reject(s3err);
        return;
      }
      const tmpFile = path.join('/tmp', Key);
      const { webhook } = res.Metadata;

      // Save the file and do the resizing
      fs.writeFile(tmpFile, res.Body, fserr => {
        if (fserr) {
          reject(fserr);
          return;
        }
        resize(tmpFile, process.env.SIZES.split(','))
          .then(results => {
            const subpromises = [];
            Object.keys(results.paths).forEach(key => {
              if (key === 'metadata') return;
              subpromises.push(s3Put(s3Media, key, results.paths[key]));
            });
            Promise.all(subpromises)
              .then(() => webhookPost(webhook, null, results.metadata).then(resolve, reject))
              .catch(err => webhookPost(webhook, err, null).then(resolve, reject));
          })
          .catch(err => webhookPost(webhook, err, null).then(resolve, reject));
      });
    });
  });
}

exports.handler = handler;
