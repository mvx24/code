if (typeof window === 'undefined') {
  class Storage {
    clear() {}
    getItem(_key: string) {
      return '';
    }
    setItem(_key: string, _value: string) {}
    removeItem(_key: string) {}
    key(_index: number) {
      return null;
    }
    get length() {
      return 0;
    }
  }

  global.Storage = Storage;
  global.localStorage = new Storage();
  global.sessionStorage = new Storage();
  global.document = {
    cookie: '',
  } as Document;
  global.addEventListener = () => {};
  global.removeEventListener = () => {};
  global.dispatchEvent = _event => false;
  global.location = {} as Location;
  global.requestAnimationFrame = _cb => 0;
  global.cancelAnimationFrame = _num => null;
  global.window = global as Window & typeof globalThis;
}

export function isSSR() {
  // navigator is defined in Node as well
  return navigator.userAgent.startsWith('Node');
}
