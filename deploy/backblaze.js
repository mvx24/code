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

// Read in .env files
dotenv.config(path.resolve(__dirname, `.env.${process.env.NODE_ENV}.local`));
dotenv.config(path.resolve(__dirname, `.env.${process.env.NODE_ENV}`));
dotenv.config(path.resolve(__dirname, `.env.local`));
dotenv.config();
if (!process.env.B2_APPLICATION_KEY_ID || !process.env.B2_APPLICATION_KEY) {
  console.error('Error: No Backblaze credentials found in environment variables');
  process.exit(1);
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
  options.headers = options.headers || {};
  options.headers.Accept = 'application/json';
  if (auth) {
    options.headers.Authorization = options.headers.Authorization || auth.authorizationToken;
  }
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
    const jsonData = !(Buffer.isBuffer(data) || typeof data === 'string');
    if (jsonData) options.headers['Content-Type'] = 'application/json';
    const req = data ? https.post(url, options, cb) : https.get(url, options, cb);
    req.on('error', e => {
      console.error(`Got error: ${e.message}`);
      process.exit(1);
    });
    if (data) {
      req.write(jsonData ? JSON.stringify(data) : data);
      req.end();
    }
  });
}

function putFiles(auth, bucketId, files, i, cb) {
  const file = files[i];
  const key = file.substr(buildDir.length + 1);
  let data = fs.readFileSync(file);
  if (config.sourceMapOrigin && (file.endsWith('.js') || file.endsWith('.css'))) {
    if (config.sourceMapOrigin.endsWith('/')) {
      config.sourceMapOrigin = config.sourceMapOrigin.substr(0, config.sourceMapOrigin.length - 1);
    }
    data = data.toString('utf8');
    data = data.split('# sourceMappingURL=');
    data = data.join(`# sourceMappingURL=${config.sourceMapOrigin}/${path.dirname(key)}/`);
  }
  b2('b2_get_upload_url', {}, auth, { bucketId }).then(upload => {
    const hash = crypto.createHash('sha1');
    hash.update(data);
    const sha1 = hash.digest('hex');
    b2(
      upload.uploadUrl,
      {
        headers: {
          Authorization: upload.authorizationToken,
          'Content-Length': Buffer.isBuffer(data) ? Buffer.length : Buffer.byteLength(data),
          'Content-Type': mime.getType(key),
          'X-Bz-File-Name': encodeURIComponent(key),
          'X-Bz-Content-Sha1': sha1,
        },
      },
      auth,
      data,
    ).then(() => {
      console.log(key);
      if (i < files.length - 1) {
        putFiles(auth, bucketId, file, i + 1);
      } else if (cb) {
        cb();
      }
    });
  });
}

function hideFiles(auth, bucketId, excludeFiles, cb) {
  b2('b2_list_file_names', {}, auth, { bucketId, maxFileCount: 999 }).then(res => {
    const { files } = res;
    const hideFile = i => {
      const { fileName } = files[i];
      if (excludeFiles.indexOf(fileName) === -1) {
        b2('b2_hide_file', {}, auth, { bucketId, fileName }).then(() => {
          console.log(fileName);
          if (i < files.length - 1) {
            hideFile(i + 1);
          } else if (cb) {
            cb();
          }
        });
      }
    };
    hideFile(0);
  });
}

function cleanupBuckets(auth) {
  // Cleanup by hiding the old deployment within the bucket(s)
  console.log(`Hiding old files from ${config.bucket}:`);
  if (config.bucketId === config.sourceMapBucketId) {
    hideFiles(auth, config.bucketId, [...buildFiles, ...sourceMapFiles]);
  } else {
    hideFiles(auth, config.bucketId, buildFiles, () => {
      console.log(`Hiding old files from ${config.sourceMapBucket}:`);
      hideFiles(auth, config.sourceMapBucketId, sourceMapFiles);
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
      console.log(`Uploading to ${config.bucket}:`);
      putFiles(auth, config.bucketId, buildFiles, 0, () => {
        // Upload the source maps
        if (config.sourceMapBucketId) {
          console.log(`Uploading to ${config.sourceMapBucket}:`);
          putFiles(auth, config.sourceMapBucketId, sourceMapFiles, 0, () => {
            cleanupBuckets(auth);
          });
        } else {
          cleanupBuckets(auth);
        }
      });
    } else {
      console.error('Error: No deployment bucket configured');
      process.exit(1);
    }
  });
});
