import * as jwt from 'jsonwebtoken';

const TOKEN_ALGORITHM = 'HS256';

function encodeToken(payload: string | object | Buffer, expires: number) {
  return jwt.sign(payload, process.env.SECRET_KEY as string, {
    algorithm: TOKEN_ALGORITHM as jwt.Algorithm,
    expiresIn: expires,
    issuer: process.env.TOKEN_ISSUER,
  });
}

function decodeToken(token: string) {
  return jwt.verify(token, process.env.SECRET_KEY as string, {
    algorithms: [TOKEN_ALGORITHM as jwt.Algorithm],
    issuer: process.env.TOKEN_ISSUER,
  });
}

export { encodeToken, decodeToken };
