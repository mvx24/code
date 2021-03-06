const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const exifParser = require('exif-parser');

function parseMetadata(inputPath) {
  return new Promise((resolve, reject) => {
    fs.readFile(inputPath, (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      // Gather the exif data
      const metadata = {};
      const parser = exifParser.create(data).enableImageSize(false);
      try {
        const result = parser.parse();
        metadata.exif = result.tags;
      } catch (err) {} // eslint-disable-line

      // Gather basic metadata
      sharp(inputPath).metadata((metaErr, info) => {
        if (metaErr) {
          reject(metaErr);
          return;
        }
        metadata.format = info.format;
        metadata.hasAlpha = info.hasAlpha;
        metadata.size = data.length;
        resolve(metadata);
      });
    });
  });
}

function resize(inputPath, sizes) {
  return new Promise((resolve, reject) => {
    parseMetadata(inputPath)
      .then(metadata => {
        const parsed = path.parse(inputPath);
        const normalizedPath = path.join(parsed.dir, `${parsed.name}-x.jpeg`);
        const originalPath = path.join(parsed.dir, `${parsed.name}.${metadata.format}`);
        const metadataPath = path.join(parsed.dir, `${parsed.name}.json`);
        const paths = { x: normalizedPath, original: originalPath, metadata: metadataPath };
        const subpromises = [];

        // Rename the input as needed
        if (inputPath !== originalPath) {
          fs.renameSync(inputPath, originalPath);
        }

        // Normalize the image
        sharp(originalPath)
          .rotate()
          .jpeg({ progressive: true })
          .toFile(normalizedPath, (err, { width, height }) => {
            if (err) {
              reject(err);
              return;
            }
            // Save the meta data
            metadata.width = width;
            metadata.height = height;
            fs.writeFileSync(metadataPath, JSON.stringify(metadata));

            // Generate resized versions from command line args
            if (sizes.length) {
              const normalizedImage = sharp(normalizedPath);
              sizes.forEach(size => {
                if (size === 'x' || size === 'original') return;
                const outputPath = path.join(parsed.dir, `${parsed.name}-${size}.jpeg`);
                const limit = size
                  .split('x')
                  .map(n => parseInt(n, 10))
                  .map(n => (isNaN(n) ? null : n));
                const resizeOpts = { width: null, height: null };
                const progressive = !(limit[0] < 200 || limit[1] < 200);
                paths[size] = outputPath;
                if (limit.length === 1) {
                  if (size.startsWith('x')) {
                    [resizeOpts.width] = limit;
                  } else if (size.endsWith('x')) {
                    [resizeOpts.height] = limit;
                  } else if (width > height) {
                    [resizeOpts.width] = limit;
                  } else {
                    [resizeOpts.height] = limit;
                  }
                } else {
                  [resizeOpts.width, resizeOpts.height] = limit;
                }
                subpromises.push(
                  new Promise((subresolve, subreject) => {
                    normalizedImage
                      .clone()
                      .rotate()
                      .resize(resizeOpts)
                      .jpeg({ progressive })
                      .toFile(outputPath, suberr => {
                        if (suberr) {
                          subreject(suberr);
                          return;
                        }
                        subresolve();
                      });
                  }),
                );
              });
            }
            // Wait for all resizing operations
            Promise.all(subpromises)
              .then(() => {
                resolve({ paths, metadata });
              })
              .catch(reject);
          });
      })
      .catch(reject);
  });
}

module.exports = resize;
