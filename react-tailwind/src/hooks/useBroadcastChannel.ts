import { useCallback, useEffect, useRef, DependencyList } from 'react';

function useBroadcastChannel<T>(
  channelName: string,
  callback?: (msg: T) => void,
  deps?: DependencyList,
): (msg: T) => void {
  const cb = useCallback(callback ? callback : (_: T) => {}, deps || []);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const sendMessage = useCallback((msg: T) => {
    channelRef.current?.postMessage(msg);
  }, []);
  useEffect(() => {
    channelRef.current = new BroadcastChannel(channelName);
    channelRef.current.onmessage = (event: MessageEvent) => {
      cb(event.data as T);
    };
    return () => {
      channelRef.current?.close();
    };
  }, [cb]);

  return sendMessage;
}

export default useBroadcastChannel;
