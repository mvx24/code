import assert from 'assert';
import { isHashedPassword, hashPassword, checkPassword } from '../src/password';

hashPassword('test')
  .then(hashed => {
    assert(hashed);
    assert(hashed.length);
    assert(isHashedPassword(hashed));
    checkPassword('test', hashed)
      .then(ok => assert(ok))
      .catch(assert.fail);
  })
  .catch(assert.fail);
