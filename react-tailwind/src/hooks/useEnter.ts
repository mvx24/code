import { useCallback, useEffect, RefObject, DependencyList } from 'react';

type KeyboardCallback = (e: KeyboardEvent) => void;

function useEnter(
  callback: KeyboardCallback,
  ref: RefObject<HTMLElement | null>,
  deps?: DependencyList,
) {
  callback = useCallback(callback, deps || []);
  useEffect(() => {
    const target = ref.current;
    const eventHandler = (e: KeyboardEvent) => {
      if (e.code !== 'Enter' || e.getModifierState('Shift')) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      callback(e);
    };

    target?.addEventListener('keypress', eventHandler);

    return () => {
      target?.removeEventListener('keypress', eventHandler);
    };
  }, [callback]);
}

export default useEnter;
