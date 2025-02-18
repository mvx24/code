import { useCallback, useEffect, RefObject, DependencyList } from 'react';

// Key can be a single character such as 'A' (Uppercase only), function e.g. 'F2' or a named key such as 'Enter'
// For a bigger list of keys see: https://www.w3.org/TR/uievents-key/#named-key-attribute-values
type Key =
  | string
  | 'F1'
  | 'F2'
  | 'F3'
  | 'F4'
  | 'F5'
  | 'F6'
  | 'F7'
  | 'F8'
  | 'F9'
  | 'F10'
  | 'F11'
  | 'F12'
  | 'Enter'
  | 'Escape'
  | 'Backspace'
  | 'Delete'
  | 'ArrowUp'
  | 'ArrowDown'
  | 'ArrowLeft'
  | 'ArrowRight'
  | 'Space'
  | 'Tab';

// NOTE: for modifier keys: 'Alt' is the Option key and 'Meta' is the Command key on macOS
type ModifierKey = 'Shift' | 'Control' | 'Alt' | 'Meta';

type KeyboardEventType = 'keydown' | 'keyup' | 'keypress';

interface KeyboardOptions {
  keys?: Key | Key[];
  modifiers?: ModifierKey | ModifierKey[];
  types?: KeyboardEventType | KeyboardEventType[];
  ref?: RefObject<Element | null>;
}

type KeyboardCallback = (e?: KeyboardEvent) => void;

function useKeyboard(
  callback: KeyboardCallback,
  keyOpts?: Key | KeyboardOptions,
  deps?: DependencyList,
) {
  let opts: KeyboardOptions | undefined;
  if (typeof keyOpts === 'string') {
    const combo = keyOpts.split(' + ');
    const keys: Key[] = [];
    const modifiers: ModifierKey[] = [];
    for (const key of combo) {
      if (['Shift', 'Control', 'Alt', 'Meta'].includes(key)) {
        modifiers.push(key as ModifierKey);
      } else if (['Command', 'Option'].includes(key)) {
        modifiers.push(key === 'Command' ? 'Meta' : 'Alt');
      } else {
        keys.push(key as Key);
      }
    }
    opts = { keys, modifiers };
  } else {
    opts = keyOpts as KeyboardOptions;
  }
  callback = useCallback(callback, deps || []);
  useEffect(() => {
    const keys = Array.isArray(opts?.keys) ? opts.keys : opts?.keys && [opts.keys];
    const modifiers = Array.isArray(opts?.modifiers)
      ? opts.modifiers
      : opts?.modifiers && [opts.modifiers];
    const types = Array.isArray(opts?.types)
      ? opts.types
      : [opts?.types || (modifiers?.length ? 'keypress' : 'keyup')];
    const target = opts?.ref?.current ?? window;

    const eventHandler = (e: Event) => {
      const evt = e as KeyboardEvent;
      if (modifiers && modifiers.length) {
        for (const modifier of modifiers) {
          if (!evt.getModifierState(modifier)) return;
        }
      }
      if (keys && keys.length && !keys.includes(evt.code.replace('Key', ''))) return;
      callback(evt);
    };

    for (const type of types) {
      target.addEventListener(type, eventHandler);
    }
    return () => {
      for (const type of types) {
        target.removeEventListener(type, eventHandler);
      }
    };
  }, [
    callback,
    opts?.keys?.toString(),
    opts?.modifiers?.toString(),
    opts?.types?.toString(),
    opts?.ref?.current,
  ]);
}

export default useKeyboard;
