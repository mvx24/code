const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const glob = require('glob');
const mime = require('mime');
const AWS = require('aws-sdk');

// AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables should be set
// https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/loading-node-credentials-environment.html
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

// Read in .env files and check for credentials
dotenv.config({ path: path.resolve(__dirname, `.env.${process.env.NODE_ENV}.local`) });
dotenv.config({ path: path.resolve(__dirname, `.env.${process.env.NODE_ENV}`) });
dotenv.config({ path: path.resolve(__dirname, '.env.local') });
dotenv.config();

if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
  error('No AWS credentials found in environment variables');
}

const buildDir = path.resolve(__dirname, '../build');
const buildFiles = glob.sync(`${buildDir}/**/*`, { nodir: true, ignore: `${buildDir}/**/*.map` });
const sourceMapFiles = glob.sync(`${buildDir}/**/*.map`, { nodir: true });

function putFiles(s3, files, i, cb) {
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
  s3.putObject(
    {
      Key: key,
      Body: data,
      CacheControl: 'no-cache',
      ContentType: mime.getType(key),
    },
    err => {
      if (err) {
        error(err);
      } else {
        log(`\u{2705}  ${key}`);
        if (i < files.length - 1) {
          putFiles(files, i + 1);
        } else if (cb) {
          cb();
        }
      }
    },
  );
}

function deleteFiles(s3, excludeFiles, cb) {
  s3.listObjects({}, (err, data) => {
    if (err) {
      error(err);
    } else {
      const files = data.Contents;
      const deleteFile = i => {
        const { Key: fileName } = files[i];
        if (excludeFiles.indexOf(fileName) === -1) {
          s3.deleteObject({ Bucket: s3.config.params.Bucket, Key: fileName }, delErr => {
            if (delErr) {
              error(delErr);
            } else {
              log(`\u{274c}  ${fileName}`);
              if (i < files.length - 1) {
                deleteFile(i + 1);
              } else if (cb) {
                cb();
              }
            }
          });
        }
      };
      deleteFile(0);
    }
  });
}

const buildS3 = new AWS.S3({
  apiVersion: 'latest',
  params: {
    Bucket: config.bucket,
  },
});
const sourceMapS3 = new AWS.S3({
  apiVersion: 'latest',
  params: { Bucket: config.sourceMapBucket },
});

function cleanupBuckets() {
  // Cleanup by deleting the old deployment within the bucket(s)
  begin(`Deleting old files from ${config.bucket}:`);
  if (config.bucket === config.sourceMapBucket) {
    deleteFiles(buildS3, [...buildFiles, ...sourceMapFiles]);
  } else {
    deleteFiles(buildS3, buildFiles, () => {
      if (config.sourceMapBucket) {
        begin(`Deleting old files from ${config.sourceMapBucket}:`);
        deleteFiles(sourceMapS3, sourceMapFiles);
      }
    });
  }
}

if (config.bucket) {
  begin(`Uploading to ${config.bucket}:`);
  putFiles(buildS3, buildFiles, 0, () => {
    if (config.sourceMapBucket) {
      begin(`Uploading to ${config.sourceMapBucket}:`);
      putFiles(sourceMapS3, sourceMapFiles, 0, cleanupBuckets);
    } else {
      cleanupBuckets();
    }
  });
} else {
  error('No deployment bucket configured');
}
