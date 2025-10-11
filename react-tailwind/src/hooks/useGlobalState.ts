import { useState } from 'react';

import useBroadcastChannel from '@/hooks/useBroadcastChannel';

declare global {
  interface Window {
    __globalState: Record<string, unknown>;
  }
}

function useGlobalState<S>(key: string, initialValue: S): [S, (newValue: S) => void] {
  const [value, setValue] = useState<S>(() => {
    if (!(key in window.__globalState)) {
      window.__globalState[key] = initialValue;
    }
    return window.__globalState[key] as S;
  });

  const broadcastValue = useBroadcastChannel(key, setValue);

  return [
    value,
    (newValue: S) => {
      if (!Object.is(window.__globalState[key], newValue)) {
        window.__globalState[key] = newValue;
        setValue(newValue);
        broadcastValue(newValue);
      }
    },
  ];
}

export default useGlobalState;
