const fs = require('fs');
const path = require('path');
const { JSDOM, ResourceLoader } = require('jsdom');

const origin = '';
const buildDir = path.resolve('./build');
const indexFile = path.join(buildDir, 'index.html');
const buildUrl = require('url').pathToFileURL(buildDir);

class FileResourceLoader extends ResourceLoader {
  fetch(url, options) {
    return super.fetch(url.replace(origin, buildUrl), options);
  }
}

JSDOM.fromFile(indexFile, {
  url: `file://${indexFile}`,
  runScripts: 'dangerously',
  resources: new FileResourceLoader(),
  contentType: 'text/html',
}).then(dom => {
  dom.window.document.addEventListener('DOMContentLoaded', () => {
    if (process.argv[3]) {
      dom.window.history.pushState(null, '', process.argv[3]);
    }
    // Wait for the rendering to complete with a setTimeout
    setTimeout(() => {
      const out = path.resolve(process.argv[2] || './out.html');
      fs.mkdirSync(path.dirname(out), { recursive: true });
      fs.writeFileSync(out, dom.serialize());
    });
  });
});
