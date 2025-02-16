import { useCallback, useEffect, useState } from 'react';

function wrappedSetItem(this: Storage, key: string, value: string) {
  window.dispatchEvent(new StorageEvent('storage', { key, newValue: value }));
  this._setItem.apply(this, [key, value]);
}

function wrappedRemoveItem(this: Storage, key: string) {
  window.dispatchEvent(new StorageEvent('storage', { key, newValue: null }));
  this._removeItem.apply(this, [key]);
}

// Wrap setItem to also send storage events within the same window
// By default, 'storage' events are sent only from storage changes in other windows
Storage.prototype._setItem = Storage.prototype.setItem;
Storage.prototype.setItem = wrappedSetItem;
Storage.prototype._removeItem = Storage.prototype.removeItem;
Storage.prototype.removeItem = wrappedRemoveItem;

type StorageValue = string | null;

function useStorage(key: string, storage: Storage): [StorageValue, (value: StorageValue) => void] {
  const [value, _setValue] = useState(() => storage.getItem(key));

  const setValue = useCallback(
    (value: StorageValue) => {
      value ? storage.setItem(key, value) : storage.removeItem(key);
      _setValue(value);
    },
    [key, _setValue],
  );

  const storageListener = useCallback(
    (e: StorageEvent) => {
      if (e.key === key) _setValue(e.newValue);
    },
    [key, _setValue],
  );

  useEffect(() => {
    window.addEventListener('storage', storageListener);
    return () => {
      window.removeEventListener('storage', storageListener);
    };
  }, [storageListener]);

  return [value, setValue];
}

export const useLocalStorage = (key: string) => useStorage(key, localStorage);
export const useSessionStorage = (key: string) => useStorage(key, sessionStorage);
