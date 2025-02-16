import { useState, useEffect, RefObject } from 'react';

export default function useHover(ref: RefObject<Element | null>) {
  const [isHovering, setHovering] = useState(false);
  useEffect(() => {
    const on = () => setHovering(true);
    const off = () => setHovering(false);
    ref.current?.addEventListener('mouseenter', on);
    ref.current?.addEventListener('mouseleave', off);
    return () => {
      ref.current?.removeEventListener('mouseenter', on);
      ref.current?.removeEventListener('mouseleave', off);
    };
  }, [ref.current]);
  return isHovering;
}
