import { DependencyList, useCallback } from 'react';

type DebounceCallback = (...args: any[]) => void;

function useDebounce(cb: DebounceCallback, deps?: DependencyList, ms = 500): DebounceCallback {
  let timeout: ReturnType<typeof setTimeout>;
  return useCallback((...args: any[]) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(cb, ms, ...args);
  }, deps || []);
}

export default useDebounce;
