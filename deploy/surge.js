const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');

// Configure surge options below
const config = {
  domain: '',
  https: false,
  www: false,
  noSourceMaps: true,
  passwords: '',
};

const buildDir = path.resolve(__dirname, '../build');

function prepareBuildDir(opts) {
  // Copy the index file to 200.html for client-side routing
  // https://surge.sh/help/adding-a-200-page-for-client-side-routing
  const indexFile = path.join(buildDir, 'index.html');
  const twoHundredFile = path.join(buildDir, '200.html');
  if (fs.existsSync(indexFile) && !fs.existsSync(twoHundredFile)) {
    fs.copyFileSync(indexFile, twoHundredFile);
  }
  if (opts.domain) {
    // https://surge.sh/help/remembering-a-domain
    if (opts.www) {
      opts.domain = `www.${opts.domain}`;
    }
    if (opts.https) {
      opts.domain = `https://${opts.domain}`;
    }
    fs.writeFileSync(path.join(buildDir, 'CNAME'), `${opts.domain}\n`);
  }
  if (opts.noSourceMaps) {
    // https://surge.sh/help/ignoring-files-and-directories
    fs.writeFileSync(path.join(buildDir, '.surgeignore'), '*.map\n');
  }
  if (opts.passwords) {
    // https://surge.sh/help/adding-password-protection-to-a-project
    if (!Array.isArray(opts.passwords)) {
      opts.passwords = [opts.passwords];
    }
    opts.passwords.push('');
    fs.writeFileSync(path.join(buildDir, 'AUTH'), opts.passwords.join('\n'));
  }
}

prepareBuildDir(config);
childProcess.execSync(`surge ${buildDir}`, { stdio: [0, 1, 2] });
