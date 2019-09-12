const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

function resize(inputPath, sizes) {
  return new Promise((resolve, reject) => {
    const promises = [];
    const parsed = path.parse(inputPath);
    const normalizedPath = path.join(parsed.dir, `x-${parsed.name}.jpeg`);
    const metadataPath = path.join(parsed.dir, `${parsed.name}.json`);

    // Gather the exif data
    const metadata = {};
    const parser = require('exif-parser')
      .create(fs.readFileSync(inputPath))
      .enableImageSize(false);
    try {
      const result = parser.parse();
      metadata.exif = result.tags;
    } catch (err) {} // eslint-disable-line

    const image = sharp(inputPath);

    // Gather basic metadata
    image.metadata((err, info) => {
      if (err) {
        reject(err);
        return;
      }
      metadata.format = info.format;
      metadata.size = info.size;
      metadata.hasAlpha = info.hasAlpha;
    });

    // Normalize the image
    sharp(inputPath)
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
            const outputPath = path.join(parsed.dir, `${size}-${parsed.name}.jpeg`);
            const limit = size
              .split('x')
              .map(n => parseInt(n, 10))
              .map(n => (isNaN(n) ? null : n));
            const resizeOpts = { width: null, height: null };
            const progressive = !(limit[0] < 200 || limit[1] < 200);
            if (limit.length === 1) {
              if (width > height) {
                [resizeOpts.width] = limit;
              } else {
                [resizeOpts.height] = limit;
              }
            } else {
              [resizeOpts.width, resizeOpts.height] = limit;
            }
            promises.push(
              new Promise((resolve, reject) => {
                normalizedImage
                  .rotate()
                  .resize(resizeOpts)
                  .jpeg({ progressive })
                  .toFile(outputPath, err => {
                    if (err) {
                      reject(err);
                      return;
                    }
                    resolve();
                  });
              }),
            );
          });
        }
      });

    // Wait for all resizing operations
    Promise.all(promises)
      .then(() => {
        resolve(metadata);
      })
      .catch(reject);
  });
}

module.exports = resize;
