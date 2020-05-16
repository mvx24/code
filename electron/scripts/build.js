const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');
const pkg = require(path.resolve('./package.json'));
const electronPkg = require(path.resolve('./node_modules/electron/package.json'));

// First compile with rollup
console.log('Building bundles...');
childProcess.execSync('rollup -c rollup/bundle.config.js', { stdio: 'inherit' });
childProcess.execSync('rollup -c rollup/main.config.js', { stdio: 'inherit' });

// chdir into build
process.chdir(path.resolve('./build'));

// Create a minimal package.json file
const minPkg = {
  name: pkg.name,
  version: pkg.version,
  description: pkg.description,
  author: pkg.author,
  homepage: pkg.homepage,
  repository: pkg.repository,
  private: pkg.private,
  license: pkg.license,
  main: pkg.main,
  build: pkg.build,
  electronVersion: electronPkg.version,
  devDependencies: {
    electron: pkg.devDependencies.electron,
    'electron-builder': pkg.devDependencies['electron-builder'],
    'regenerator-runtime': pkg.devDependencies['regenerator-runtime'],
  },
  dependencies: {
    // Native modules
  },
  scripts: {
    // Build Native modules
    postinstall: 'electron-builder install-app-deps',
  },
};
fs.writeFileSync(path.resolve('./package.json'), JSON.stringify(minPkg, null, 2));
console.log('Created build/package.json');

// Install all dependencies
childProcess.execSync('yarn install', { stdio: 'inherit' });

// Copy the required support files
[
  '../index.html',
  '../icon.icns',
  '../icon.png',
  '../icon.ico',
  '../background.png',
  '../background@2x.png',
  '../entitlements.mac.plist',
  './node_modules/electron/path.txt',
].forEach(file => {
  const src = path.resolve(file);
  const dest = path.join(path.resolve('.'), path.basename(file));
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`cp ${src} -> ${dest}`);
  }
});
try {
  childProcess.execSync('cp -R ../preload preload', { stdio: 'inherit' });
} catch (e) {}
try {
  childProcess.execSync('cp -R ../icons icons', { stdio: 'inherit' });
} catch (e) {}
