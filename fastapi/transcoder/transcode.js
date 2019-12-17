const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');

const videoMaxWidth = 480;
const videoMaxDuration = 60.5;
const videoFormats = ['mp4', 'webm', 'mov', 'ogv', 'flv', '3gp', 'gif'];
const scaleFilter = `scale='min(${videoMaxWidth.toString()}\\,iw):-2'`;

function resolveFormat(inputPath, metadata) {
  const inputExt = path.parse(inputPath).ext.substr(1);
  const formats = metadata.format.format_name.split(',');
  if (formats.indexOf(inputExt) !== -1) return inputExt;
  for (let i = 0; i < videoFormats.length; i += 1) {
    if (formats.indexOf(videoFormats[i]) !== -1) return videoFormats[i];
  }
  return videoFormats[0];
}

/**
 * Verifies that the video has valid video stream and is less than the maximum duration
 *
 * @returns A Promise the resolves with output information
 */
function ffprobeVerify(inputPath) {
  return new Promise((resolve, reject) => {
    childProcess.execFile(
      'ffprobe',
      ['-v', 'quiet', '-print_format', 'json', '-show_format', '-show_streams', '-i', inputPath],
      (err, stdout, stderr) => {
        if (err) {
          reject(stderr);
          return;
        }
        const outputObj = JSON.parse(stdout);
        const hasVideoStream = outputObj.streams.some(stream => {
          return (
            stream.codec_type === 'video' &&
            ((stream.duration || outputObj.format.duration) <= videoMaxDuration ||
              stream.codec_name === 'gif')
          );
        });

        if (!hasVideoStream) {
          reject(new Error('No valid video stream found'));
        } else {
          resolve(outputObj);
        }
      },
    );
  });
}

/**
 * Runs the ffmpeg command on the video file
 *
 * @param inputPath Path to the video file.
 * @param outputPath Path to output video file.
 * @returns Promise that does not resolve to anything
 */
function ffmpegProcess(inputPath, outputPath) {
  const gifArgs = inputPath.endsWith('gif') ? ['-crf', '12', '-pix_fmt', 'yuv420p'] : [];

  return new Promise((resolve, reject) => {
    childProcess.execFile(
      'ffmpeg',
      [
        '-y',
        '-loglevel',
        'warning',
        '-i',
        inputPath,
        '-c:a',
        'copy',
        '-movflags',
        '+faststart',
        '-metadata',
        'description=' + 'description',
        '-vf',
        'thumbnail',
        '-vf',
        scaleFilter,
        ...gifArgs,
        outputPath,
      ],
      (err, stdout, stderr) => {
        if (err) {
          reject(stderr);
          return;
        }
        resolve();
      },
    );
  });
}

/**
 * Output a single frame from the start of the original video.
 *
 * @param inputPath Path to the video file.
 * @param outputPath Path to output image file.
 * @returns Promise that does not resolve to anything
 */
function outputSingleFrame(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    childProcess.execFile(
      'ffmpeg',
      ['-y', '-loglevel', 'warning', '-i', inputPath, '-vframes', '1', outputPath],
      (err, stdout, stderr) => {
        if (err) {
          reject(stderr);
          return;
        }
        resolve();
      },
    );
  });
}

function transcode(inputPath, sizes) {
  return new Promise((resolve, reject) => {
    ffprobeVerify(inputPath)
      .then(metadata => {
        const parsed = path.parse(inputPath);
        const originalPath = path.join(
          parsed.dir,
          `${parsed.name}.${resolveFormat(inputPath, metadata)}`,
        );
        const outputPath = path.join(parsed.dir, `${parsed.name}-480x.mp4`);
        const metadataPath = path.join(parsed.dir, `${parsed.name}.json`);
        const posterPath = path.join(parsed.dir, `${parsed.name}-poster.jpeg`);
        const paths = {
          original: originalPath,
          metadata: metadataPath,
          poster: posterPath,
          '480x': outputPath,
        };

        // Rename the input as needed
        if (inputPath !== originalPath) {
          fs.renameSync(inputPath, originalPath);
        }

        // Save the meta data
        fs.writeFileSync(metadataPath, JSON.stringify(metadata));

        // Save the first frame post
        outputSingleFrame(originalPath, posterPath)
          .then(() => ffmpegProcess(originalPath, outputPath))
          .then(() => {
            resolve({ paths, metadata });
          })
          .catch(reject);
      })
      .catch(err => {
        console.error(err);
        reject();
      });
  });
}

module.exports = transcode;
