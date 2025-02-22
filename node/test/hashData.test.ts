import assert from 'assert';
import hashData from '../src/hashData';

assert.strictEqual(hashData('test', { a: 1, b: 2, c: 3 }), hashData('test', { a: 1, b: 2, c: 3 }));
assert.strictEqual(hashData('test', { c: 3, b: 2, a: 1 }), hashData('test', { a: 1, b: 2, c: 3 }));
assert.strictEqual(
  hashData('test', { c: 3, b: 2, a: { deep: 123 } }),
  hashData('test', { a: { deep: 123 }, b: 2, c: 3 }),
);
assert.strictEqual(
  hashData('test', { c: 3, b: 2, a: '[object Object]' }),
  hashData('test', { a: { deep: 123 }, b: 2, c: 3 }, false),
);
assert.notStrictEqual(
  hashData('test', { c: 3, b: 2, a: '[object Object]' }),
  hashData('test', { a: { deep: 123 }, b: 2, c: 3 }),
);

assert.notStrictEqual(
  hashData('test', { a: 1, b: 2, c: 3 }),
  hashData('test', { a: 1, b: 2, c: 4 }),
);
assert.notStrictEqual(
  hashData('test', { a: 1, b: 2, c: 3 }),
  hashData('other-test-name', { a: 1, b: 2, c: 3 }),
);
assert.notStrictEqual(
  hashData('test', { c: 3, b: 2, a: { deep: 123 } }),
  hashData('test', { a: { deep: 123 }, b: 2, c: 3 }, false),
);
