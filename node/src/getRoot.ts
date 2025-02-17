/** Returns a global value from the root window or global object. */
export default function getRoot(key: string) {
  // self will support both in-browser window and WebWorker
  const root =
    (typeof self === 'object' && self.self === self && self) ||
    (typeof global === 'object' && global.global === global && global);
  return key ? (root as { [i: string]: unknown })[key] : root;
}
