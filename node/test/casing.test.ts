import assert from 'assert';
import { toSnakeCase, toCamelCase, snakeCaseKeys, camelCaseKeys } from '../src/casing';

assert.strictEqual(toSnakeCase('camelCase'), 'camel_case');

assert.strictEqual(toCamelCase('snake_case'), 'snakeCase');

assert.deepStrictEqual(snakeCaseKeys({ camelCase: 'value' }), { camel_case: 'value' });
assert.deepStrictEqual(snakeCaseKeys({ camelCase: { nestedKey: 'value' } }), {
  camel_case: { nested_key: 'value' },
});
assert.deepStrictEqual(snakeCaseKeys({ camelCase: { nestedKey: 'value' } }, false), {
  camel_case: { nestedKey: 'value' },
});
assert.deepStrictEqual(camelCaseKeys({ camel_case: 'value' }), { camelCase: 'value' });
assert.deepStrictEqual(camelCaseKeys({ camel_case: { nested_key: 'value' } }), {
  camelCase: { nestedKey: 'value' },
});
assert.deepStrictEqual(camelCaseKeys({ camel_case: { nested_key: 'value' } }, false), {
  camelCase: { nested_key: 'value' },
});
