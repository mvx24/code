/**
 * Functions for transforming a camelCase style dictionaries to dictionaries
 * with valid kebab-case css rules and the correct browser prefix added.
 */

const ua = navigator.userAgent.toLowerCase();
const [browser] =
  /(chrome|safari)/.exec(ua) ||
  /firefox/.exec(ua) ||
  /msie/.exec(ua) ||
  /trident/.exec(ua) ||
  /opera/.exec(ua) ||
  '';
const stylePrefix =
  { chrome: 'webkit', firefox: 'Moz', msie: 'ms', opera: 'O', safari: 'webkit', trident: 'ms' }[
    browser
  ] || '';
const cssPrefix = `-${stylePrefix.toLowerCase()}-`;

const getStylePrefix = p => (document.documentElement.style[p] === undefined ? cssPrefix : '');

const toKebabCase = str => {
  const words = [];
  let start = 0;
  let c;
  let i;
  for (i = 0; i < str.length; ++i) {
    c = str.charCodeAt(i);
    if (c >= 65 && c <= 90 && i) {
      words.push(str.substring(start, i).toLowerCase());
      start = i;
    }
  }
  words.push(str.substring(start, i).toLowerCase());
  return words.join('-');
};

function styles(obj) {
  if (obj) {
    Object.keys(obj).forEach(prop => {
      const cssProp = getStylePrefix(prop) + toKebabCase(prop);
      if (cssProp !== prop) {
        obj[cssProp] = obj[prop];
        delete obj[prop];
      }
    });
  }
  return obj;
}

export default styles;
