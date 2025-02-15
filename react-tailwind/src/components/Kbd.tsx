import { ReactNode } from 'react';

export function Kbd(props: { children: ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center rounded border border-b-4 border-gray-300 bg-gray-200 px-2 py-1 font-mono text-sm font-semibold text-gray-800">
      {props.children}
    </kbd>
  );
}

export const KbdLeftArrow = () => <Kbd>&#x2190;</Kbd>;
export const KbdRightArrow = () => <Kbd>&#x2192;</Kbd>;
export const KbdUpArrow = () => <Kbd>&#x2191;</Kbd>;
export const KbdDownArrow = () => <Kbd>&#x2193;</Kbd>;
export const KbdEnter = () => <Kbd>&#x23CE;</Kbd>;
export const KbdSpace = () => <Kbd>&#2423;</Kbd>;
