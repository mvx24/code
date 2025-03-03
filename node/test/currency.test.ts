import assert from 'assert';
import { formatCurrency, formatAccounting } from '../src/currency';

assert.strictEqual(formatCurrency(1000), '$1,000.00');
assert.strictEqual(formatCurrency(131444.239), '$131,444.24');
assert.strictEqual(formatCurrency(-131444.239), '-$131,444.24');
assert.strictEqual(formatAccounting(1000), '$1,000.00');
assert.strictEqual(formatAccounting(-1000), '($1,000.00)');
assert.strictEqual(formatAccounting(1000, 'EUR'), '€1,000.00');
assert.strictEqual(formatAccounting(-1000, 'EUR'), '(€1,000.00)');
assert.strictEqual(formatAccounting(1000, 'JPY'), '¥1,000');
assert.strictEqual(formatAccounting(-1000, 'JPY'), '(¥1,000)');
assert.strictEqual(formatAccounting(1000, 'GBP'), '£1,000.00');
assert.strictEqual(formatAccounting(-1000, 'GBP'), '(£1,000.00)');
