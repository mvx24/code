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

// Read in .env files and check for credentials
dotenv.config(path.resolve(__dirname, `.env.${process.env.NODE_ENV}.local`));
dotenv.config(path.resolve(__dirname, `.env.${process.env.NODE_ENV}`));
dotenv.config(path.resolve(__dirname, `.env.local`));
dotenv.config();
if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
  console.error('Error: No AWS credentials found in environment variables');
  process.exit(1);
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
        console.error(err);
        process.exit(1);
      } else {
        console.log(key);
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
      console.error(err);
      process.exit(1);
    } else {
      const files = data.Contents;
      const deleteFile = i => {
        const { Key: fileName } = files[i];
        if (excludeFiles.indexOf(fileName) === -1) {
          s3.deleteObject({ Bucket: s3.config.params.Bucket, Key: fileName }, delErr => {
            if (delErr) {
              console.error(delErr);
              process.exit(1);
            } else {
              console.log(fileName);
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
  console.log(`Deleting old files from ${config.bucket}:`);
  if (config.bucket === config.sourceMapBucket) {
    deleteFiles(buildS3, [...buildFiles, ...sourceMapFiles]);
  } else {
    deleteFiles(buildS3, buildFiles, () => {
      console.log(`Deleting old files from ${config.sourceMapBucket}:`);
      deleteFiles(sourceMapS3, sourceMapFiles);
    });
  }
}

if (config.bucket) {
  console.log(`Uploading to ${config.bucket}:`);
  putFiles(buildS3, buildFiles, 0, () => {
    if (config.sourceMapBucket) {
      console.log(`Uploading to ${config.sourceMapBucket}:`);
      putFiles(sourceMapS3, sourceMapFiles, 0, cleanupBuckets);
    } else {
      cleanupBuckets();
    }
  });
} else {
  console.error('Error: No deployment bucket configured');
  process.exit(1);
}
