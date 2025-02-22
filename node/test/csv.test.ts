import assert from 'assert';
import { parseCSV } from '../src/csv';

// Test variations of CSV data for correct parsing
assert.deepStrictEqual(parseCSV('a,b,c\n1,2,3\n4,5,6'), [
  ['a', 'b', 'c'],
  ['1', '2', '3'],
  ['4', '5', '6'],
]);
assert.deepStrictEqual(parseCSV('a,b,c\n"1,2",3,4'), [
  ['a', 'b', 'c'],
  ['1,2', '3', '4'],
]);
assert.deepStrictEqual(parseCSV('a,b,c\n"1""2",3,4'), [
  ['a', 'b', 'c'],
  ['1"2', '3', '4'],
]);
