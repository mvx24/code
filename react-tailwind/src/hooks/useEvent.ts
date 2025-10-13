import { useCallback, useEffect, DependencyList } from 'react';

function useEvent<T>(
  eventName: string,
  callback?: (msg: T) => void,
  deps?: DependencyList,
): (msg: T) => void {
  const cb = useCallback(callback ? callback : (_: T) => {}, deps || []);

  const sendMessage = useCallback(
    (msg: T) => {
      const customEvent = new CustomEvent(eventName, { detail: msg });
      document.dispatchEvent(customEvent);
    },
    [eventName],
  );

  useEffect(() => {
    const eventListener = (event: Event) => {
      const customEvent = event as CustomEvent<T>;
      cb(customEvent.detail);
    };

    document.addEventListener(eventName, eventListener);

    return () => {
      document.removeEventListener(eventName, eventListener);
    };
  }, [eventName, cb]);

  return sendMessage;
}

export default useEvent;
