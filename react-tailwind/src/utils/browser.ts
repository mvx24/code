export function getBrowserPrefix() {
  const ua = navigator.userAgent.toLowerCase();
  const browser = (/(chrome|safari|edg)/.exec(ua) ||
    /firefox/.exec(ua) ||
    /msie/.exec(ua) ||
    /trident/.exec(ua) ||
    /opera/.exec(ua) ||
    '')[0];
  const stylePrefix =
    {
      chrome: 'webkit',
      firefox: 'Moz',
      msie: 'ms',
      opera: 'O',
      safari: 'webkit',
      edg: 'webkit',
      trident: 'ms',
    }[browser] || '';
  const eventPrefix = { chrome: 'webkit', opera: 'webkit', safari: 'webkit' }[browser] || '';
  return { browser, stylePrefix, eventPrefix };
}
