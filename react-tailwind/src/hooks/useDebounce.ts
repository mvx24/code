import { DependencyList, SyntheticEvent, useCallback } from 'react';

type DebounceCallback = (e?: SyntheticEvent) => void;

function useDebounce(cb: DebounceCallback, deps?: DependencyList, ms = 500): DebounceCallback {
  let timeout: ReturnType<typeof setTimeout>;
  return useCallback((e?: SyntheticEvent) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(cb, ms, e);
  }, deps || []);
}

export default useDebounce;
