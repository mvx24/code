window.addEventListener('DOMContentLoaded', () => {
  if (process.env.NODE_ENV === 'development') {
    // Setup babel require hooks to translate es6 importing/exporting and jsx
    require('@babel/register');
    // Add a CSS require hook to append CSS files into the app
    const fs = require('fs');
    const loadedCSS = {};
    require.extensions['.css'] = function (module, filename) {
      if (!loadedCSS[filename]) {
        loadedCSS[filename] = true;
        const css = fs.readFileSync(filename, 'utf8').trim();
        if (css.length) {
          const style = document.createElement('style');
          style.type = 'text/css';
          style.textContent = css;
          document.head.appendChild(style);
        }
      }
    };
    // Start the main app
    require('../src');
  } else {
    // Start the app using bundled JS and CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'bundle.css';
    document.head.appendChild(link);
    require('../bundle');
  }
});
