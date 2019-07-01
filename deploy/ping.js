const http = require('http');
const resolveUrl = require('url').resolve;

const origin = '';
const sitemap = resolveUrl(origin, '/sitemap.xml');

function ping(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(`${url}?sitemap=${encodeURIComponent(sitemap)}`, res => {
      const { statusCode } = res;
      if (statusCode !== 200) {
        reject(new Error(`Pinging ${url} Failed.\nStatus Code: ${statusCode}`));
        process.exit(1);
      }
      res.setEncoding('utf8');
      let rawData = '';
      res.on('data', chunk => {
        rawData += chunk;
      });
      res.on('end', () => {
        resolve(rawData);
      });
    });
    req.on('error', reject);
  });
}

if (!origin) {
  console.log('No origin set!');
  process.exit(1);
}

// Ping Google (https://support.google.com/webmasters/answer/183669?hl=en)
ping('http://www.google.com/webmasters/tools/ping')
  .then(() => {
    console.log('Sitemap sucessfully submitted to Google');
  })
  .catch(err => console.log(err));

// Ping Bing (http://www.bing.com/webmaster/help/how-to-submit-sitemaps-82a15bd4)
ping('http://www.bing.com/ping')
  .then(() => {
    console.log('Sitemap sucessfully submitted to Bing');
  })
  .catch(err => console.log(err));
