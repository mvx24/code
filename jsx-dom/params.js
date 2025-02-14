/**
 * Functions for reading values from query and hash string parameters.
 */

export function getQueryStringValue(str, name) {
  const [, val] = new RegExp(`${name}=(.*?)(&|$)`).exec(str.replace(/\+/g, ' ')) || [0, null];
  return val !== null ? decodeURIComponent(val) : null;
}

export function parseQueryString(str) {
  const re = /(\?|#|&)(.+?)=(.*?)(?=&|$)/g;
  const strSpaced = str.replace(/\+/g, ' ');
  const params = {};
  let match = null;
  while ((match = re.exec(strSpaced)) !== null) {
    params[decodeURIComponent(match[2])] = decodeURIComponent(match[3]);
  }
  return params;
}

export const createQueryString = data =>
  Object.keys(data)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`)
    .join('&');

export const getURLParameter = p => getQueryStringValue(window.location.search, p);
export const getHashParameter = p => getQueryStringValue(window.location.hash, p);
export const getURLParameters = () => parseQueryString(window.location.search);
export const getHashParameters = () => parseQueryString(window.location.hash);
