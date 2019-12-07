#!/usr/bin/env node
const connect = require('connect');
const dotenv = require('dotenv');
const http = require('http');
const path = require('path');
const resize = require('./resize');

const stagingDir = process.env.NODE_ENV === 'production' ? '/run/resizer' : path.resolve('./');

// Read in .env files for size configuration
dotenv.config({ path: path.resolve(__dirname, `.env.${process.env.NODE_ENV}.local`) });
dotenv.config({ path: path.resolve(__dirname, `.env.${process.env.NODE_ENV}`) });
dotenv.config({ path: path.resolve(__dirname, '.env.local') });
dotenv.config();
process.env.SIZES = process.env.SIZES || '';

function parseQueryString(str) {
  const re = /(\?|#|&)(.+?)=(.*?)(?=&|$)/g;
  const strSpaced = str.replace(/\+/g, ' ');
  const params = {};
  let match = null;
  while ((match = re.exec(strSpaced)) !== null) {
    params[decodeURIComponent(match[2])] = decodeURIComponent(match[3]);
  }
  return params;
}

function resizeRequestHandler(req, res, next) {
  const params = parseQueryString(require('url').parse(req.url).search);
  const file = path.join(stagingDir, params.filename);
  const sizes = params.sizes || process.env.SIZES;
  resize(file, sizes.split(',')).then(meta => {
    const data = JSON.stringify(meta);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Length', Buffer.byteLength(data));
    res.write(data);
    res.end();
    next();
  });
}

function errorHandler(err, req, res, next) {
  const data = JSON.stringify({ code: 400, message: err.message });
  res.statusCode = 400;
  res.statusMessage = err.message;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Length', Buffer.byteLength(data));
  res.write(data);
  res.end();
  next();
}

const app = connect();
app.use('/', resizeRequestHandler);
app.use(errorHandler);
http.createServer(app).listen(8005);
console.log('Server now listening at http://0.0.0.0:8005');
