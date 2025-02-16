/**
 * Older functions to deal with query and hash parameters new code can just use URL and URLSearchParams classes
 * getQueryStringValue() = new URLSearchParams(str).get(name)
 * parseQueryString(str) = new URLSearchParams(str.substring(1))
 * createQueryString(data) = new URLSearchParams(data).toString()
 * getQueryParameter(n) = new URLSearchParams(window.location.search.substring(1)).get(n)
 * getHashParameter(n) = new URLSearchParams(window.location.hash.substring(1)).get(n)
 * getQueryParameters() = new URLSearchParams(window.location.search.substring(1))
 * getHashParameters() = new URLSearchParams(window.location.hash.substring(1))
 */

export function getQueryStringValue(str: string, name: string) {
  const [, val] = new RegExp(`${name}=(.*?)(&|$)`).exec(str.replace(/\+/g, ' ')) || [0, null];
  return val !== null ? decodeURIComponent(val) : null;
}

export function parseQueryString(str: string) {
  const re = /(\?|#|&)(.+?)=(.*?)(?=&|$)/g;
  const strSpaced = str.replace(/\+/g, ' ');
  const params: Record<string, string> = {};
  let match = null;
  while ((match = re.exec(strSpaced)) !== null) {
    params[decodeURIComponent(match[2])] = decodeURIComponent(match[3]);
  }
  return params;
}

export const createQueryString = (data: Record<string, any>) =>
  Object.keys(data)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(data[key].toString())}`)
    .join('&');

export const getQueryParameter = (n: string) => getQueryStringValue(window.location.search, n);
export const getHashParameter = (n: string) => getQueryStringValue(window.location.hash, n);
export const getQueryParameters = () => parseQueryString(window.location.search);
export const getHashParameters = () => parseQueryString(window.location.hash);
