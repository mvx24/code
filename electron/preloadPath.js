const path = require('path');

/** Resolves absolute path to preload files for both development and production. */
function preloadPath(filename) {
  if (process.env.NODE_ENV === 'development') {
    return path.resolve(__dirname, `../preload/${filename}`);
  }
  // The main.js bundle is next to preload directory
  return path.resolve(__dirname, `preload/${filename}`);
}

module.exports = preloadPath;
