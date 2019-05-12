/**
 * setupProxy.js for create-react-app that integrates webpack-symmetric.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

const httpProxyMiddleware = require('http-proxy-middleware');
const { createBackendProxy } = require('webpack-symmetric');

const options = {
  backend: '',
  paths: [],
  subpaths: [],
};

// Excluded proxy urls and webpack static file patterns from the webpack config
// https://github.com/facebook/create-react-app/blob/master/packages/react-scripts/config/webpack.config.js
const excludeProxyRegex = new RegExp(
  [
    '^/static/js/bundle\\.js',
    '^/static/js/.+?\\.[a-z0-9]{8}\\.js',
    '^/static/js/.+?\\.chunk\\.js',
    '^/static/js/.+?\\.[a-z0-9]{8}\\.chunk\\.js',
    '^/static/media/.+?\\.[a-z0-9]{8}\\..*',
    '^/static/css/.+?\\.[a-z0-9]{8}\\.css',
    '^/static/css/.+?\\.[a-z0-9]{8}\\.chunk\\.css',
  ].join('|'),
);

const dir = options.home || process.env.SYMMETRIC_HOME || path.join(os.homedir(), '.symmetric');
const keyPath = path.join(dir, 'symmetric.key');
const certPath = path.join(dir, 'symmetric.crt');
const pemPath = path.resolve('./node_modules/webpack-dev-server/ssl/server.pem');

function setupProxy(app) {
  // Set backend and insecure options from the env (HTTPS is also used by create-react-app)
  options.insecure = !(process.env.HTTPS === 'true');
  options.backend = options.backend || process.env.BACKEND;
  options.generateCert = true;

  // If no backend is configured then do not proxy anything
  if (!options.backend) return;

  // Setup the backend proxy and generate the cert if needed
  const proxyConfig = createBackendProxy(options);

  // Because access to the webpack-dev-server config isn't available
  // Copy the key and cert to the path webpack-dev-server uses for the self-signed cert
  if (!options.insecure) {
    const key = fs.readFileSync(keyPath, 'utf8');
    const cert = fs.readFileSync(certPath, 'utf8');
    fs.writeFileSync(pemPath, key + cert);
  }

  // Wrap the bypass to match exluded proxy urls and webpack static files first
  // No proxy bypass function means always use proxy middleware by returning false
  const proxyBypass =
    (typeof proxyConfig.bypass === 'function' && proxyConfig.bypass) || (() => false);
  const bypass = (req, res, config) => {
    if (!excludeProxyRegex.test(req.url)) return proxyBypass(req, res, config);
    return req.url;
  };

  // Create and use the proxy middleware
  const proxyMiddleware = httpProxyMiddleware(proxyConfig);
  app.use((req, res, next) => {
    const bypassUrl = bypass(req, res, proxyConfig);
    if (bypassUrl) {
      req.url = bypassUrl;
      next();
    } else if (proxyMiddleware) {
      proxyMiddleware(req, res, next);
    } else {
      next();
    }
  });
}

module.exports = setupProxy;
