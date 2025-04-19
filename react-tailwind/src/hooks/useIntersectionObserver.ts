import { useEffect, useMemo, useRef, useState } from 'react';

const useIntersectionObserver = (options?: IntersectionObserverInit) => {
  const ref = useRef<HTMLElement>(null);
  const [isInView, setIsInView] = useState(false);
  const observer = useMemo(
    () =>
      new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsInView(true);
          }
        });
      }, options),
    options ? Object.values(options) : [],
  );

  useEffect(() => {
    const target = ref.current;
    if (target) {
      observer.observe(target);
      return () => {
        observer.unobserve(target);
      };
    }
  }, [ref.current]);

  return { ref, isInView };
};

export default useIntersectionObserver;
