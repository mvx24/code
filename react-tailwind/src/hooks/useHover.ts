import { useState, useEffect, RefObject } from 'react';

export default function useHover(ref: RefObject<Element>) {
  const [isHovering, setHovering] = useState(false);
  useEffect(() => {
    ref.current.addEventListener('mouseenter', () => {
      setHovering(true);
    });
    ref.current.addEventListener('mouseleave', () => {
      setHovering(false);
    });
  });
  return isHovering;
}
