import assert from 'assert';
import isNumber from '../src/isNumber';

assert(isNumber(1));
assert(isNumber(0));
assert(isNumber(-1));
assert(isNumber(1.1));
assert(isNumber(0.0));
assert(isNumber(-1.1));
assert(isNumber(Infinity));
assert(isNumber(-Infinity));

assert(!isNumber('1'));
assert(!isNumber('0'));
assert(!isNumber('-1'));
assert(!isNumber('1.1'));
assert(!isNumber(NaN));
assert(!isNumber(null));
assert(!isNumber(undefined));
assert(!isNumber({}));
assert(!isNumber([]));
assert(!isNumber(true));
assert(!isNumber(false));
assert(!isNumber(''));
assert(!isNumber('a'));
