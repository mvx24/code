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

if (!config.zoneId) {
  console.error('Error: No BunnyCDN zoneId specified');
  process.exit(1);
}

// Read in .env files
dotenv.config(path.resolve(__dirname, `.env.${process.env.NODE_ENV}.local`));
dotenv.config(path.resolve(__dirname, `.env.${process.env.NODE_ENV}`));
dotenv.config(path.resolve(__dirname, `.env.local`));
dotenv.config();

const accessKey = process.env.BUNNYCDN_ACCESS_KEY;
const storageAccessKey = process.env.BUNNYCDN_STORAGE_ACCESS_KEY;
const sourceMapStorageAccessKey = process.env.BUNNYCDN_SOURCE_MAP_STORAGE_ACCESS_KEY;
if (!accessKey) {
  console.error('Error: No BunnyCDN credentials found in environment variables');
  process.exit(1);
}
if (config.storageZone && !storageAccessKey) {
  console.error('Error: No BunnyCDN storage credentials found in environment variables');
  process.exit(1);
}
if (config.storageZone && !sourceMapStorageAccessKey) {
  console.error('Error: No BunnyCDN source map storage credentials found in environment variables');
  process.exit(1);
}

function bunnyApi(method, endpoint, data, storageAccessKey) {
  const url = storageAccessKey
    ? `https://storage.bunnycdn.com/${endpoint}`
    : `https://bunnycdn.com/api/${endpoint}`;
  const options = {
    headers: {
      AccessKey: storageAccessKey || accessKey,
      Accept: 'application/json',
    },
  };
  if (data)
    options.headers['Content-Type'] = storageAccessKey
      ? mime.getType(endpoint)
      : 'application/json';
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
    const req = https[method](url, options, cb);
    req.on('error', e => {
      console.error(`Got error: ${e.message}`);
      process.exit(1);
    });
    if (data) {
      req.write(storageAccessKey ? data : JSON.stringify(data));
      req.end();
    }
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
      data = data.join(`# sourceMappingURL=${config.sourceMapOrigin}/${path.dirname(key)}/`);
    }
    promises.push(bunnyApi('put', `${storageZone}/${filename}`, data, storageAccessKey));
  });
  return Promise.all(promises);
}

function deleteFiles(storageZone, storageAccessKey, excludeFiles) {
  return bunnyApi('get', storageZone, null, storageAccessKey).then(existingFiles => {
    const promises = [];
    existingFiles.forEach(file => {
      if (file.IsDirectory) return;
      const filename = `${file.Path.substr(1)}/${file.ObjectName}`;
      if (excludeFiles.indexOf(filename) === -1) {
        console.log(filename);
        promises.push(bunnyApi('delete', filename, null, storageAccessKey));
      }
    });
    return Promise.all(promises);
  });
}

function purge() {
  return bunnyApi('post', `pullzone/${config.zoneId}/purgeCache`, { id: config.zoneId }).then(
    result => {
      console.log('BunnyCDN Purge:');
      console.log('Result', JSON.stringify(result));
    },
  );
}

if (config.storageZone) {
  const buildDir = path.resolve(__dirname, '../build');
  const buildFiles = glob.sync(`${buildDir}/**/*`, { nodir: true, ignore: `${buildDir}/**/*.map` });
  const sourceMapFiles = glob.sync(`${buildDir}/**/*.map`, { nodir: true });

  const cleanupStorage = () => {
    // Cleanup by deleting the old deployment within the bucket(s)
    console.log(`Deleting old files from ${config.storageZone}:`);
    if (config.storageZone === config.sourceMapStorageZone) {
      return deleteFiles(config.storageZone, config.storageAccessKey, [
        ...buildFiles,
        ...sourceMapFiles,
      ]);
    } else {
      return deleteFiles(config.storageZone, config.storageAccessKey, buildFiles).then(() => {
        console.log(`Deleting old files from ${config.sourceMapStorageZone}:`);
        return deleteFiles(
          config.sourceMapStorageZone,
          config.sourceMapStorageAccessKey,
          sourceMapFiles,
        );
      });
    }
  };

  // Upload the build
  console.log(`Uploading to ${config.storageZone}:`);
  putFiles(config.storageZone, buildFiles, 0)
    .then(() => {
      // Upload the source maps
      if (config.sourceMapStorageZone) {
        console.log(`Uploading to ${config.sourceMapStorageZone}:`);
        return putFiles(config.sourceMapStorageZone, sourceMapFiles, 0).then(cleanupStorage);
      } else {
        return cleanupStorage();
      }
    })
    .then(purge);
} else {
  purge();
}
