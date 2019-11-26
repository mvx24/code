#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const mjml2html = require('mjml');

const sourceDir = path.resolve('./src');
const buildDir = path.resolve('./build');

if (!fs.existsSync(buildDir)) fs.mkdirSync(buildDir);

fs.readdir(sourceDir, (err, files) => {
  files.forEach(file => {
    if (file[0] === '_') return;
    const filePath = path.join(sourceDir, file);
    fs.readFile(filePath, 'utf8', (err, data) => {
      const output = mjml2html(data, { filePath });
      const outputFile = path.join(buildDir, `${path.basename(file, '.mjml')}.html`);
      fs.writeFile(outputFile, output.html, () => {});
    });
  });
});
