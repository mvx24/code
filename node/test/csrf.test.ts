import assert from 'assert';
import { getCSRFToken, validateCSRFToken } from '../src/csrf';

assert(validateCSRFToken(getCSRFToken()));
assert(!validateCSRFToken(''));
assert(!validateCSRFToken('invalid'));
