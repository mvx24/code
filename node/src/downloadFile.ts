import { Buffer } from 'buffer';
import { IncomingMessage } from 'http';
import * as https from 'https';

const USER_AGENT =
  process.env.USER_AGENT ||
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1.1 Safari/605.1.15';

async function downloadFile(url: string): Promise<Buffer> {
  if (!url) return Promise.resolve(Buffer.alloc(0));
  return new Promise(resolve => {
    const req = https.get(
      url,
      { headers: { 'User-Agent': USER_AGENT } },
      (res: IncomingMessage) => {
        const { statusCode } = res;
        let error;
        if (statusCode !== 200) {
          error = new Error(`Request Failed.\nStatus Code: ${statusCode}`);
        }
        if (error) {
          console.error(error.message);
          process.exit(1);
        }
        const rawDataBuffers: Buffer[] = [];
        res.on('data', (chunk: Buffer) => {
          rawDataBuffers.push(chunk);
        });
        res.on('end', () => {
          resolve(Buffer.concat(rawDataBuffers));
        });
      },
    );
    req.on('error', e => {
      console.error(`Got error: ${e.message}`);
      process.exit(1);
    });
  });
}

export default downloadFile;
