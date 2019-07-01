/* global Buffer */
const fs = require('fs');
const https = require('https');
const path = require('path');
const dotenv = require('dotenv');
const glob = require('glob');
const mime = require('mime');

// Configure the purge and option storage deployment using the following
// sourceMapStorageZone must be set to deploy source maps - can be same as storageZone
const config = {
  zoneId: 0,
  storageZone: '',
  sourceMapStorageZone: '',
  sourceMapOrigin: '',
};

const log = msg => console.log(msg);
const begin = msg => console.log(['\x1b[1m', msg, '\x1b[0m'].join(''));
const error = msg => {
  console.error(['\x1b[1;31m', 'Error: ', msg, '\x1b[0m'].join(''));
  process.exit(1);
};

// Read in .env files
dotenv.config(path.resolve(__dirname, `.env.${process.env.NODE_ENV}.local`));
dotenv.config(path.resolve(__dirname, `.env.${process.env.NODE_ENV}`));
dotenv.config(path.resolve(__dirname, `.env.local`));
dotenv.config();

const accessKey = process.env.BUNNYCDN_ACCESS_KEY;
const buildStorageAccessKey = process.env.BUNNYCDN_STORAGE_ACCESS_KEY;
const sourceMapStorageAccessKey = process.env.BUNNYCDN_SOURCE_MAP_STORAGE_ACCESS_KEY;

if (!config.zoneId) error('No BunnyCDN zoneId specified');
if (!accessKey) error('No BunnyCDN credentials found in environment variables');
if (config.storageZone && !buildStorageAccessKey) {
  error('No BunnyCDN storage credentials found in environment variables');
}
if (config.sourceMapStorageZone && !sourceMapStorageAccessKey) {
  error('No BunnyCDN source map storage credentials found in environment variables');
}

const buildDir = path.resolve(__dirname, '../build');
const buildFiles = glob.sync(`${buildDir}/**/*`, { nodir: true, ignore: `${buildDir}/**/*.map` });
const sourceMapFiles = glob.sync(`${buildDir}/**/*.map`, { nodir: true });

function bunnyApi(method, endpoint, data, storageAccessKey) {
  const url = storageAccessKey
    ? `https://storage.bunnycdn.com/${endpoint}`
    : `https://bunnycdn.com/api/${endpoint}`;
  const options = {
    headers: {
      AccessKey: storageAccessKey || accessKey,
      Accept: 'application/json',
    },
    method,
  };
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
        resolve(JSON.parse(rawData || 'null'));
      });
    };
    if (data) {
      body = storageAccessKey ? data : JSON.stringify(data);
      options.headers['Content-Type'] = storageAccessKey
        ? mime.getType(endpoint)
        : 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(body);
    }
    const req = https.request(url, options, cb);
    req.on('error', err => error(err.message));
    if (body) req.write(body);
    req.end();
  });
}

function putFiles(storageZone, storageAccessKey, files) {
  const promises = [];
  files.forEach(file => {
    const filename = file.substr(buildDir.length + 1);
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
      data = data.join(`# sourceMappingURL=${config.sourceMapOrigin}/${path.dirname(filename)}/`);
    }
    promises.push(
      bunnyApi('put', `${storageZone}/${filename}`, data, storageAccessKey).then(() => {
        log(`\u{2705}  ${filename}`);
      }),
    );
  });
  return Promise.all(promises);
}

function deleteFiles(storageZone, storageAccessKey, excludeFiles, subpath = '') {
  const excludeObjects = excludeFiles.map(ex => `${storageZone}/${ex.substr(buildDir.length + 1)}`);
  return bunnyApi('get', `${storageZone}/${subpath}/`, null, storageAccessKey).then(
    existingFiles => {
      const promises = [];
      existingFiles.forEach(file => {
        if (file.IsDirectory) {
          promises.push(deleteFiles(storageZone, storageAccessKey, excludeFiles, file.ObjectName));
          return;
        }
        const filename = `${file.Path.substr(1)}${file.ObjectName}`;
        if (excludeObjects.indexOf(filename) === -1) {
          log(`\u{274c}  ${filename}`);
          promises.push(bunnyApi('delete', filename, null, storageAccessKey));
        }
      });
      return Promise.all(promises);
    },
  );
}

function purge() {
  return bunnyApi('post', `pullzone/${config.zoneId}/purgeCache`, { id: config.zoneId }).then(
    result => {
      begin(`BunnyCDN Purge:`);
      log(`\u{1f680}  Result ${result ? JSON.stringify(result) : 'successful'}`);
    },
  );
}

if (config.storageZone) {
  const cleanupStorage = () => {
    // Cleanup by deleting the old deployment within the bucket(s)
    begin(`Deleting old files from ${config.storageZone}:`);
    if (config.storageZone === config.sourceMapStorageZone) {
      return deleteFiles(config.storageZone, buildStorageAccessKey, [
        ...buildFiles,
        ...sourceMapFiles,
      ]);
    }
    return deleteFiles(config.storageZone, buildStorageAccessKey, buildFiles).then(() => {
      if (config.sourceMapStorageZone) {
        begin(`Deleting old files from ${config.sourceMapStorageZone}:`);
        return deleteFiles(config.sourceMapStorageZone, sourceMapStorageAccessKey, sourceMapFiles);
      }
      return null;
    });
  };

  // Upload the build
  begin(`Uploading to ${config.storageZone}:`);
  putFiles(config.storageZone, buildStorageAccessKey, buildFiles)
    .then(() => {
      // Upload the source maps
      if (config.sourceMapStorageZone) {
        begin(`Uploading to ${config.sourceMapStorageZone}:`);
        return putFiles(
          config.sourceMapStorageZone,
          config.sourceMapStorageAccessKey,
          sourceMapFiles,
        ).then(cleanupStorage);
      }
      return cleanupStorage();
    })
    .then(purge);
} else {
  purge();
}
