import path from 'path';
import * as fs from 'fs/promises';

import { jpeg, json, png, webp } from 'itty-router';

import { jsonp, mp4, webm, css, js } from './responses';

export default async function serveFile(dir: string, filename: string) {
  const ext = path.extname(filename).toLowerCase();
  const data = await fs.readFile(path.join(dir, filename));
  if (!data) {
    throw new Error('File not found');
  }
  if (ext === '.css') {
    return css(data.toString('utf8'));
  } else if (ext === '.js') {
    return js(data.toString('utf8'));
  } else if (ext === '.jpg' || ext === '.jpeg') {
    return jpeg(data);
  } else if (ext === '.png') {
    return png(data);
  } else if (ext === '.webp') {
    return webp(data);
  } else if (ext === '.mp4') {
    return mp4(data);
  } else if (ext === '.webm') {
    return webm(data);
  } else if (ext === '.json') {
    return json(JSON.parse(data.toString('utf8')));
  } else if (ext === 'jsonp') {
    return jsonp(JSON.parse(data.toString('utf8')));
  }
  throw new Error('Unsupported file type');
}
