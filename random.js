// Generate a 2-byte time-secured random uid by taking the last 4 characters of a number between 0x10000 and 0x20000
const randomUID = () =>
  (Math.floor((1 + Math.random()) * 0x10000) ^ Date.now() % 0x10000).toString(16).substr(1);
const c4 = randomUID;
const randomGUID = () => `${c4()}${c4()}-${c4()}-${c4()}-${c4()}-${c4()}${c4()}${c4()}`;
const randomCode = len => {
  let c = '';
  const l = len || 12;
  while (c.length < l) c += c4();
  return c.substr(0, l);
};

export { randomUID, randomGUID, randomCode };
