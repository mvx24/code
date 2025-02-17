import { Data, isData } from './data';

export function toCamelCase(str: string) {
  const components = str.split('_');
  if (components.length === 1) return str;
  let camelCase = components[0].toLowerCase();
  if (components.length > 1) {
    for (let i = 1; i < components.length; i += 1) {
      camelCase += components[i].substring(0, 1).toUpperCase() + components[i].substring(1);
    }
  }
  return camelCase;
}

export function toSnakeCase(str: string) {
  const words = [];
  let wordStart = 0;
  for (let c, i = 0; i < str.length; i += 1) {
    c = str[i];
    if (i && c === c.toUpperCase()) {
      words.push(str.substring(wordStart, i).toLowerCase());
      wordStart = i;
    }
  }
  words.push(str.substring(wordStart).toLowerCase());
  return words.join('_');
}

/** Does a conversion of snake_case attributes to camelCase. */
export function camelCaseKeys(obj: unknown, deep = true) {
  if (!isData(obj)) return obj;
  const original: Data = obj;
  const converted: Data = {};
  for (const key in original) {
    const value = original[key];
    converted[toCamelCase(key)] =
      deep && typeof value === 'object' ? camelCaseKeys(value, deep) : value;
  }
  return converted;
}

/** Does a conversion of camelCase attributes to snake_case. */
export function snakeCaseKeys(obj: unknown, deep = true) {
  if (!isData(obj)) return obj;
  const original: Data = obj;
  const converted: Data = {};
  for (const key in original) {
    const value = original[key];
    converted[toSnakeCase(key)] =
      deep && typeof value === 'object' ? snakeCaseKeys(value, deep) : value;
  }
  return converted;
}

/** Capitalize the first letter of each word in a string. */
export function title(str: string) {
  return str
    .trim()
    .split(' ')
    .filter(Boolean)
    .map(word => `${word[0].toUpperCase()}${word.substring(1).toLowerCase()}`)
    .join(' ');
}
