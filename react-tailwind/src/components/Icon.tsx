import { ReactNode } from 'react';
import clsx from 'clsx';

export interface IconProps {
  className?: string;
  title?: string;
  solid?: boolean;
}

interface _IconProps extends IconProps {
  children: ReactNode;
  viewBox: string;
  [key: string]: unknown;
}

export function Icon({ title, children, solid, className, viewBox, ...rest }: _IconProps) {
  const titleId = `icon-${Math.floor((1 + Math.random()) * 0x10000)}`;
  const hasSize = className && (className.startsWith('size-') || className.includes(' size-'));
  const hasWidth = className && (className.startsWith('w-') || className.includes(' w-'));
  const hasHeight = className && (className.startsWith('h-') || className.includes(' h-'));

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      aria-labelledby={title && titleId}
      className={clsx(
        'inline-block align-text-bottom',
        { 'w-[1.5em]': !hasSize && !hasWidth },
        { 'h-[1.5em]': !hasSize && !hasHeight },
        { 'fill-current stroke-none': solid },
        { 'fill-none stroke-current': !solid },
        className,
      )}
      role="img"
      {...rest}
    >
      {title && <title id={titleId}>{title}</title>}
      {children}
    </svg>
  );
}
