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

export const getURLParameter = getQueryStringValue.bind(null, window.location.search);
export const getHashParameter = getQueryStringValue.bind(null, window.location.hash);
export const getURLParameters = parseQueryString.bind(null, window.location.search);
export const getHashParameters = parseQueryString.bind(null, window.location.hash);
