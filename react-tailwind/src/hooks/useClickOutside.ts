import { useEffect, RefObject } from 'react';

type ClickOutsideCallback = (e?: MouseEvent) => void;

/** Calls a callback when click occurs outside of the given ref */
function useClickOutside(ref: RefObject<Element | null>, callback: ClickOutsideCallback) {
  useEffect(() => {
    function clickListener(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        callback(e);
      }
    }
    document.addEventListener('click', clickListener);
    return () => {
      document.removeEventListener('click', clickListener);
    };
  }, [ref.current, callback]);
}

export default useClickOutside;
