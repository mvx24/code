const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');
const pkg = require(path.resolve('./package.json'));

// First compile with rollup
console.log('Building bundles...');
childProcess.execSync('rollup -c', { stdio: [0, 1, 2] });

// chdir into build
process.chdir(path.resolve('./build'));

// Install electron and get the package info
fs.writeFileSync(path.resolve('./package.json'), '{}');
childProcess.execSync('yarn add --dev electron', { stdio: [0, 1, 2] });
const buildPkg = require(path.resolve('./package.json'));
const electronPkg = require(path.resolve('./node_modules/electron/package.json'));

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
  devDependencies: buildPkg.devDependencies,
};
fs.writeFileSync(path.resolve('./package.json'), JSON.stringify(minPkg, null, 2));
console.log('Created build/package.json');

// Copy the required support files
[
  '../main.js',
  '../index.html',
  '../preload.js',
  '../icon.icns',
  '../icon.png',
  '../icon.ico',
  '../background.png',
  '../background@2x.png',
  '../entitlements.mac.plist',
].forEach(file => {
  const src = path.resolve(file);
  const dest = path.join(path.resolve('./build'), file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`cp ${src} -> ${dest}`);
  }
});
try {
  childProcess.execSync('cp -R ../lib lib', { stdio: [0, 1, 2] });
} catch (e) {}
try {
  childProcess.execSync('cp -R ../icons icons', { stdio: [0, 1, 2] });
} catch (e) {}
