export default function delay(callback, ms) {
  return new Promise(resolve => setTimeout(resolve, ms)).then(callback);
}
