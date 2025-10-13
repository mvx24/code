import { useCallback, useEffect, DependencyList } from 'react';

declare global {
  interface Window {
    evtSource: EventSource;
  }
}

function useEventSource<T = Record<string, unknown>>(
  eventName: string,
  callback: (data: T) => void,
  deps?: DependencyList,
) {
  const listener = useCallback((event: MessageEvent) => {
    callback(JSON.parse(event.data) as T);
  }, deps || []);
  useEffect(() => {
    window.evtSource.addEventListener(eventName, listener);
    return () => {
      window.evtSource.removeEventListener(eventName, listener);
    };
  }, [eventName, callback]);
}

export default useEventSource;
