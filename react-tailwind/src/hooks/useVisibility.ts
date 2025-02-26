import { useEffect, useCallback, DependencyList } from 'react';

type VisibilityCallback = (e?: Event) => void;

export default function useVisibility(callback: VisibilityCallback, deps?: DependencyList) {
  const cb = useCallback(callback, deps || []);
  useEffect(() => {
    document.addEventListener('visibilitychange', cb);
    return () => {
      document.removeEventListener('visibilitychange', cb);
    };
  }, [cb]);
}
