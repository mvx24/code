import { useEffect } from 'react';

function useNoScroll(active: boolean) {
  useEffect(() => {
    if (active) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [active]);
}

export default useNoScroll;
