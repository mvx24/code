import { useState } from 'react';

function useStorage<V>(key: string, initialValue: V | (() => V), storage: Storage = localStorage) {
  const [value, setValue] = useState(() => {
    const storedValue = storage.getItem(key);
    return storedValue !== null ? storedValue : initialValue;
  });

  const updateStorage = (value: string) => {
    storage.setItem(key, value);
    setValue(value);
  };

  return [value, updateStorage] as const;
}

export default useStorage;
