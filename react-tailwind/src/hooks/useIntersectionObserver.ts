import { RefObject, useEffect, useMemo, useState } from 'react';

const useIntersectionObserver = (
  ref: RefObject<Element | null>,
  options?: IntersectionObserverInit,
) => {
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
        observer.disconnect();
      };
    }
  }, []);

  return isInView;
};

export default useIntersectionObserver;
