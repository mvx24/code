import * as crypto from 'crypto';

const PASSWORD_HASH_LEN = 187;

function isHashedPassword(password: string): boolean {
  return password.length === PASSWORD_HASH_LEN && password.startsWith('$scrypt-');
}

function hashPassword(password: string, _salt?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    let salt;
    if (!_salt) {
      salt = crypto.randomBytes(64);
    } else {
      salt = Buffer.from(_salt, 'base64');
    }
    crypto.scrypt(
      Buffer.from(password, 'utf8'),
      salt,
      64,
      { N: 2 ** 15, r: 8, p: 1, maxmem: 1024 * 1024 * 40 },
      (err, derivedKey) => {
        if (err) {
          reject(err);
          return;
        }
        const encodedSalt = salt.toString('base64');
        const encodedKey = derivedKey.toString('base64');
        resolve(`$scrypt-0$${encodedSalt}$${encodedKey}`);
      },
    );
  });
}

function checkPassword(password: string, hashed: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const [, , salt] = hashed.split('$');
    hashPassword(password, salt).then(hash => resolve(hash === hashed), reject);
  });
}

export { isHashedPassword, hashPassword, checkPassword };
