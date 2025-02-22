import assert from 'assert';
import { encodeToken, decodeToken } from '../src/token';
import { isData } from '../src/data';

process.env.SECRET_KEY = 'yf8Mg&ka!*@tbemvot-citzuk.2vUtmi';
process.env.TOKEN_ISSUER = 'Node App';

const token = encodeToken({ sub: 'test@user.com', custom: 'abc' }, 1000);
assert.strictEqual(typeof token, 'string');
assert(token.length);
const decoded = decodeToken(token);
assert(isData(decoded));
assert.strictEqual(decoded.sub, 'test@user.com');
