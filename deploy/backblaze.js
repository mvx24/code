/* global Buffer */
const crypto = require('crypto');
const fs = require('fs');
const https = require('https');
const path = require('path');
const dotenv = require('dotenv');
const glob = require('glob');
const mime = require('mime');

// B2_APPLICATION_KEY_ID and B2_APPLICATION_KEY environment variables should be set
// Environment variables can be configured with .env files or CI/CD settings
// https://gitlab.com/help/ci/variables/README
// NOTE: This script won't gzip because the CDN should handle that

// Configure the deployment using the following
// sourceMapBucket must be set to deploy source maps - can be same as bucket
const config = {
  bucket: '',
  sourceMapBucket: '',
  sourceMapOrigin: '',
};

const log = msg => console.log(msg);
const begin = msg => console.log(['\x1b[1m', msg, '\x1b[0m'].join(''));
const error = msg => {
  console.error(['\x1b[1;31m', 'Error: ', msg, '\x1b[0m'].join(''));
  process.exit(1);
};

// Read in .env files
dotenv.config({ path: path.resolve(__dirname, `.env.${process.env.NODE_ENV}.local`) });
dotenv.config({ path: path.resolve(__dirname, `.env.${process.env.NODE_ENV}`) });
dotenv.config({ path: path.resolve(__dirname, '.env.local') });
dotenv.config();
if (!process.env.B2_APPLICATION_KEY_ID || !process.env.B2_APPLICATION_KEY) {
  error('No Backblaze credentials found in environment variables');
}

const buildDir = path.resolve(__dirname, '../build');
const buildFiles = glob.sync(`${buildDir}/**/*`, { nodir: true, ignore: `${buildDir}/**/*.map` });
const sourceMapFiles = glob.sync(`${buildDir}/**/*.map`, { nodir: true });

function b2(endpoint, options = {}, auth, data) {
  let url;
  if (endpoint.startsWith('https://')) {
    url = endpoint;
  } else {
    url = `${auth ? auth.apiUrl : 'https://api.backblazeb2.com'}/b2api/v2/${endpoint}`;
  }
  options.method = data ? 'post' : 'get';
  options.headers = options.headers || {};
  options.headers.Accept = 'application/json';
  if (auth) {
    options.headers.Authorization = options.headers.Authorization || auth.authorizationToken;
  }
  return new Promise(resolve => {
    let body;
    const cb = res => {
      const { statusCode } = res;
      if (statusCode >= 400) error(`Request Failed.\nStatus Code: ${statusCode}`);
      res.setEncoding('utf8');
      let rawData = '';
      res.on('data', chunk => {
        rawData += chunk;
      });
      res.on('end', () => {
        resolve(JSON.parse(rawData));
      });
    };
    if (data) {
      body = data;
      if (!(Buffer.isBuffer(data) || typeof data === 'string')) {
        body = JSON.stringify(data);
        options.headers['Content-Type'] = 'application/json';
      }
      options.headers['Content-Length'] = Buffer.byteLength(body);
    }
    const req = https.request(url, options, cb);
    req.on('error', err => error(err.message));
    if (body) req.write(body);
    req.end();
  });
}

function putFiles(auth, bucketId, files) {
  const promises = [];
  files.forEach(file => {
    const key = file.substr(buildDir.length + 1);
    let data = fs.readFileSync(file);
    if (config.sourceMapOrigin && (file.endsWith('.js') || file.endsWith('.css'))) {
      if (config.sourceMapOrigin.endsWith('/')) {
        config.sourceMapOrigin = config.sourceMapOrigin.substr(
          0,
          config.sourceMapOrigin.length - 1,
        );
      }
      data = data.toString('utf8');
      data = data.split('# sourceMappingURL=');
      data = data.join(`# sourceMappingURL=${config.sourceMapOrigin}/${path.dirname(key)}/`);
    }
    promises.push(
      b2('b2_get_upload_url', {}, auth, { bucketId }).then(upload => {
        const hash = crypto.createHash('sha1');
        hash.update(data);
        const sha1 = hash.digest('hex');
        return b2(
          upload.uploadUrl,
          {
            headers: {
              Authorization: upload.authorizationToken,
              'Content-Type': mime.getType(key),
              'X-Bz-File-Name': encodeURIComponent(key).replace(/%2F/g, '/'),
              'X-Bz-Content-Sha1': sha1,
            },
          },
          auth,
          data,
        ).then(() => log(`\u{2705}  ${key}`));
      }),
    );
  });
  return Promise.all(promises);
}

function hideFiles(auth, bucketId, excludeFiles) {
  const excludeObjects = excludeFiles.map(ex => ex.substr(buildDir.length + 1));
  return new Promise(resolve => {
    b2('b2_list_file_names', {}, auth, { bucketId, maxFileCount: 999 }).then(res => {
      const { files } = res;
      Promise.all(
        files.map(file => {
          const { fileName } = file;
          if (excludeObjects.indexOf(fileName) === -1) {
            return b2('b2_hide_file', {}, auth, { bucketId, fileName }).then(() => {
              log(`\u{274c}  ${fileName}`);
            });
          }
          return Promise.resolve();
        }),
      ).then(resolve);
    });
  });
}

function cleanupBuckets(auth) {
  // Cleanup by hiding the old deployment within the bucket(s)
  begin(`Hiding old files from ${config.bucket}:`);
  if (config.bucketId === config.sourceMapBucketId) {
    hideFiles(auth, config.bucketId, [...buildFiles, ...sourceMapFiles]);
  } else {
    hideFiles(auth, config.bucketId, buildFiles).then(() => {
      if (config.sourceMapBucket) {
        begin(`Hiding old files from ${config.sourceMapBucket}:`);
        hideFiles(auth, config.sourceMapBucketId, sourceMapFiles);
      }
    });
  }
}

// Authorize the account and then do the uploading
b2('b2_authorize_account', {
  auth: `${process.env.B2_APPLICATION_KEY_ID}:${process.env.B2_APPLICATION_KEY}`,
}).then(auth => {
  // Resolve bucket names to ids
  b2('b2_list_buckets', {}, auth, { accountId: auth.accountId }).then(res => {
    res.buckets.forEach(entry => {
      if (entry.bucketName === config.bucket) {
        config.bucketId = entry.bucketId;
      } else if (entry.bucketName === config.sourceMapBucket) {
        config.sourceMapBucketId = entry.bucketId;
      }
    });
    if (config.bucketId) {
      // Upload the build
      begin(`Uploading to ${config.bucket}:`);
      putFiles(auth, config.bucketId, buildFiles).then(() => {
        // Upload the source maps
        if (config.sourceMapBucketId) {
          begin(`Uploading to ${config.sourceMapBucket}:`);
          putFiles(auth, config.sourceMapBucketId, sourceMapFiles).then(() => {
            cleanupBuckets(auth);
          });
        } else {
          cleanupBuckets(auth);
        }
      });
    } else {
      error('No deployment bucket configured');
    }
  });
});
