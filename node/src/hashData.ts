import { createHash } from 'crypto';

/** Hash some data to compare objects */
export default function hashData(name: string, data: Record<string, unknown>, deep = true) {
  const hash = createHash('sha256');
  hash.update(name);
  Object.keys(data)
    .sort()
    .forEach(key => {
      hash.update(key);
      if (deep && typeof data[key] === 'object') {
        hash.update(hashData(key, data[key] as Record<string, unknown>, deep));
      } else if (data[key]) {
        hash.update(data[key].toString());
      }
    });
  return hash.digest('hex').substring(0, 10);
}
