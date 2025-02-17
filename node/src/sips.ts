import { exec } from 'child_process';

type SipAction =
  | 'rotate'
  | 'flip'
  | 'cropToHeightWidth'
  | 'padToHeightWidth'
  | 'resampleHeightWidth'
  | 'resampleWidth'
  | 'resampleHeight'
  | 'resampleHeightWidthMax'
  | 'getProperty'
  | 'setProperty';

type SipProperty =
  | 'dpiHeight'
  | 'dpiWidth'
  | 'pixelHeight'
  | 'pixelWidth'
  | 'typeIdentifier'
  | 'format'
  | 'formatOptions'
  | 'space'
  | 'samplesPerPixel'
  | 'bitsPerSample'
  | 'creation'
  | 'make'
  | 'model'
  | 'software'
  | 'description'
  | 'copyright'
  | 'artist'
  | 'profile'
  | 'hasAlpha';

type SipProperties = Partial<Record<SipProperty, string>>;

// Run a sips command
function sips(
  action: SipAction,
  params: string[],
  inputFile: string,
  outputFile?: string,
): Promise<SipProperties | void> {
  return new Promise((resolve, reject) => {
    if (action === 'getProperty') {
      const command = `sips ${params.map((p) => `--${action} ${p}`).join(' ')} ${inputFile}`;
      console.log(command);
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(`Error: ${error.message}`);
          return;
        }
        if (stderr) {
          reject(`Stderr: ${stderr}`);
          return;
        }
        const properties: SipProperties = {};
        stdout
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean)
          .forEach((line) => {
            const [key, value] = line.split(':');
            if (key && value) {
              properties[key.trim() as SipProperty] = value.trim();
            }
          });
        resolve(properties);
      });
    } else {
      const command =
        `sips --${action} ${params.join(' ')} ${inputFile}` +
        (outputFile ? ` --out ${outputFile}` : '');
      console.log(command);
      exec(command, (error, _stdout, stderr) => {
        if (error) {
          reject(`Error: ${error.message}`);
          return;
        }
        if (stderr) {
          reject(`Stderr: ${stderr}`);
          return;
        }
        resolve(undefined);
      });
    }
  });
}

export default sips;
