import { useState, useEffect, useMemo } from 'react';

type Breakpoint = 'desktop' | 'tablet' | 'mobile';

function useBreakpoint(): Breakpoint {
  const [recalc, setRecalc] = useState(false);

  const breakpoint = useMemo(() => {
    const width = window.innerWidth;
    if (width < 768) {
      return 'mobile';
    } else if (width >= 768 && width < 1024) {
      return 'tablet';
    } else {
      return 'desktop';
    }
  }, [recalc]);

  useEffect(() => {
    const handleResize = () => setRecalc(r => !r);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return breakpoint;
}

export default useBreakpoint;
