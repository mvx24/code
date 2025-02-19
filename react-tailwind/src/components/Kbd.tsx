import { ReactNode } from 'react';

export function Kbd(props: { children: ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center rounded-sm border border-b-4 border-gray-300 bg-gray-200 px-2 py-1 font-mono text-sm font-semibold text-gray-800">
      {props.children}
    </kbd>
  );
}

export const KbdLeftArrow = () => <Kbd>&#x2190;</Kbd>;
export const KbdRightArrow = () => <Kbd>&#x2192;</Kbd>;
export const KbdUpArrow = () => <Kbd>&#x2191;</Kbd>;
export const KbdDownArrow = () => <Kbd>&#x2193;</Kbd>;

export const KbdSpace = () => <Kbd>&#x2423;</Kbd>;
export const KbdCommand = () => <Kbd>&#x2318; Cmd</Kbd>;
export const KbdOption = () => <Kbd>&#x2325; Opt</Kbd>;
export const KbdControl = () => <Kbd>&#x2303; Ctl</Kbd>;
export const KbdShift = () => <Kbd>&#x21E7; Shift</Kbd>;
export const KbdEscape = () => <Kbd>&#x238B; Esc</Kbd>;
export const KbdCapsLock = () => <Kbd>&#x21EA;</Kbd>;
export const KbdTab = () => <Kbd>&#x21E5; Tab</Kbd>;
export const KbdBackTab = () => <Kbd>&#x21E4; Shift Tab</Kbd>;
export const KbdEnter = () => <Kbd>&#x23CE;</Kbd>;
export const KbdReturn = () => <Kbd>&#x21B5;</Kbd>;
export const KbdBackspace = () => <Kbd>&#x232B; Back</Kbd>;
export const KbdDelete = () => <Kbd>&#x2326; Del</Kbd>;
export const KbdHome = () => <Kbd>&#x21F1; Home</Kbd>;
export const KbdEnd = () => <Kbd>&#x21F2; End</Kbd>;
export const KbdPageUp = () => <Kbd>&#x21DE; Pg Up</Kbd>;
export const KbdPageDown = () => <Kbd>&#x21DF; Pg Dn</Kbd>;
