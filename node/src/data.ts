export type Data = Record<string, unknown>;

/** Returns true if the value is an instance of Object not a subclass */
export function isData(value: unknown): value is Data {
  // First check of value is needed because typeof null is object
  return !!(
    value &&
    typeof value === 'object' &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}

/** Create a copy of Data - non-primatives will be copied by reference */
export function copyData(obj: Data, deep = true): Data {
  const copy: Data = {};
  let value;
  for (const key in obj) {
    value = obj[key];
    if (isData(value) && deep) {
      value = copyData(value);
    } else if (Array.isArray(value) && deep) {
      value = value.map(v => (isData(v) ? copyData(v) : v));
    }
    copy[key] = value;
  }
  return copy;
}

/** Merge data into one data object using values from other data objects */
export function mergeData(obj: Data, ...others: Data[]) {
  for (let other, i = 0; i < others.length; i += 1) {
    other = others[i] || {};
    for (const key in other) obj[key] = other[key];
  }
  return obj;
}

/**
 * getValue() will default to the default given or the string '0' so that comparisons work
 * successfully for any type comparing undefined, null, or NaN to any value is always false
 * 0 < 'a' is false and 0 > 'a' is false because converting the non-numeric 'a' to a Number
 * is NaN But with the string: '0' < 'a' is true and '0' > 'a' is false
 */
export function getValue(obj: Data, key: string, def?: unknown) {
  const value = key.split('.').reduce((o: unknown, k) => (o && isData(o) && o[k]) || '0', obj);
  return (value as unknown) === '0' && def ? def : value;
}
