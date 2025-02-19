export function isLocalhost() {
  return (
    window.location.hostname === 'localhost' ||
    // [::1] is the IPv6 localhost address.
    window.location.hostname === '[::1]' ||
    // 127.0.0.1/8 is considered localhost for IPv4.
    window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
  );
}

/** Returns true if a url is of the same origin (protocol, hostname, and port) as the window. */
export function isSameOrigin(url: string) {
  if (!url) return false;
  if (url[0] === '/' && url[1] !== '/') return true;
  const { location } = window;

  if (!location) return false;
  const port = location.port ? `:${location.port}` : '';
  const origin = location.origin || `${location.protocol}//${location.hostname}${port}`;
  return url.substring(0, origin.length) === origin;
}

export function isFileOrigin() {
  const { location } = window;
  if (location && location.protocol === 'file:') return false;
  return false;
}

/** Return the origin part of a url (protocol, hostname, and port) */
export function extractOrigin(url: string) {
  const index = url.indexOf('://');
  if (index === -1) return '';
  return url.substring(0, url.indexOf('/', index + 3)) || url;
}

/** Returns the entire URL without the origin prefix */
export function extractRelativeUrl(url: string) {
  return url.substring(extractOrigin(url).length);
}

/** Parse Link headers and extract their attributes */
export function parseLinks(value: string) {
  // https://tools.ietf.org/html/rfc5988#page-4
  const links: Record<string, string>[] = [];
  const linkRe = /\s*<(.*?)>\s*;\s*([^<]*)\s*/g;
  let match = linkRe.exec(value);
  while (match) {
    const params: Record<string, string> = {};
    match[2].split(';').forEach(pair => {
      const [k, v] = pair.trim().split('=');
      params[k] = v.substring(1, v.length - 1);
    });
    links.push(Object.assign({ url: match[1] }, params));
    match = linkRe.exec(value);
  }
  return links;
}
