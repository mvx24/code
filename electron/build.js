const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');
const pkg = require(path.resolve('./package.json'));

// First compile with rollup
console.log('Building bundles...');
childProcess.execSync('rollup -c', { stdio: [0, 1, 2] });

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
};
fs.writeFileSync(path.resolve('./build/package.json'), JSON.stringify(minPkg, null, 2));
console.log('Created build/package.json');

// Copy the required support files
['./main.js', './index.html'].forEach(file => {
  const src = path.resolve(file);
  const dest = path.join(path.resolve('./build'), file);
  fs.copyFileSync(src, dest);
  console.log(`cp ${src} -> ${dest}`);
});
