import { useEffect } from 'react';

/** Calls a callback when localStorage value changes for cross tab or window communication */
function useMessage(key: string, cb: (v: string | null) => void) {
  useEffect(() => {
    let currentValue = window.localStorage.getItem(key);
    const storageListener = () => {
      const updatedValue = window.localStorage.getItem(key);
      if (currentValue !== updatedValue) {
        cb(updatedValue);
      }
    };
    window.addEventListener('storage', storageListener);
    return () => {
      window.removeEventListener('storage', storageListener);
    };
  }, []);
}

export default useMessage;
