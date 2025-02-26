import { DependencyList, useEffect, useCallback } from 'react';

type IntervalCallback = () => void;

function useInterval(callback: IntervalCallback, deps?: DependencyList, ms = 500) {
  let timeout: ReturnType<typeof setInterval>;
  const cb = useCallback(callback, deps || []);
  useEffect(() => {
    if (timeout) {
      clearInterval(timeout);
    }
    timeout = setInterval(cb, ms);
  }, [cb, ms]);
}

export default useInterval;
