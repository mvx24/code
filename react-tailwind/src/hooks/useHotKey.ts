import { useCallback, useEffect, DependencyList } from 'react';

// Key can be a single character such as 'KeyA' for 'a', function e.g. 'F2' or a named key such as 'Enter'
// For a bigger list of keys see:
// https://www.w3.org/TR/uievents-key/#named-key-attribute-values
// https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_code_values
// https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values

// Examples:
// 'F1' | 'F2' | 'F3' | 'F4' | 'F5' | 'F6' | 'F7' | 'F8' | 'F9' | 'F10' | 'F11' | 'F12'
// 'Enter' | 'Escape' | 'Backspace' | 'Delete' | 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight' | 'Space' | 'Tab'

// Valid modifier keys:
// NOTE: for modifier keys: 'Alt' is the Option key and 'Meta' is the Command key on macOS
// 'Shift' | 'Control' | 'Alt' | 'Meta'

type HotKeyCallback = (e?: KeyboardEvent) => void;

function useHotKey(keys: string[], callback: HotKeyCallback, deps?: DependencyList) {
  const cb = useCallback(callback, deps || []);
  useEffect(() => {
    const modifiers = keys.filter(key => ['Shift', 'Control', 'Alt', 'Meta'].includes(key));
    const key = keys.filter(key => !modifiers.includes(key))[0];
    const type = modifiers.length ? 'keypress' : 'keyup';
    function keyListener(e: KeyboardEvent) {
      if (e.code === key && modifiers.every(mod => e.getModifierState(mod))) {
        cb(e);
      }
    }
    window.addEventListener(type, keyListener);
    return () => {
      window.removeEventListener(type, keyListener);
    };
  }, [keys, cb]);
}

export const useCommandK = (callback: HotKeyCallback, deps?: DependencyList) =>
  useHotKey(['Meta', 'KeyK'], callback, deps);
export const useCommandEnter = (callback: HotKeyCallback, deps?: DependencyList) =>
  useHotKey(['Meta', 'Enter'], callback, deps);
export const useCommandS = (callback: HotKeyCallback, deps?: DependencyList) =>
  useHotKey(['Meta', 'KeyS'], callback, deps);
export const useCommandZ = (callback: HotKeyCallback, deps?: DependencyList) =>
  useHotKey(['Meta', 'KeyZ'], callback, deps);
export const useEscape = (callback: HotKeyCallback, deps?: DependencyList) =>
  useHotKey(['Escape'], callback, deps);
