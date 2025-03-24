import { useRef, useState } from 'react';
import { Link } from 'wouter';

import {
  Kbd,
  KbdCommand,
  KbdOption,
  KbdControl,
  KbdShift,
  KbdCapsLock,
  KbdReturn,
  KbdBackspace,
  KbdDelete,
  KbdEscape,
  KbdPageUp,
  KbdPageDown,
  KbdEnd,
  KbdHome,
  KbdTab,
  KbdBackTab,
  KbdLeftArrow,
  KbdRightArrow,
  KbdUpArrow,
  KbdDownArrow,
  KbdEnter,
  KbdSpace,
} from '@/components/Kbd';
import Compute from '@/icons/Compute';
import Nutrition from '@/icons/Nutrition';
import useHover from '@/hooks/useHover';
import useKeyboard from '@/hooks/useKeyboard';
import { useCommandF, useEscape, useCommandEnter } from '@/hooks/useHotKey';
import useCookie from '@/hooks/useCookie';
import { useLocalStorage } from '@/hooks/useStorage';
import useClickOutside from '@/hooks/useClickOutside';
import useOnlineStatus from '@/hooks/useOnlineStatus';
import toggleFullscreen from '@/utils/toggleFullscreen';

function Homepage() {
  const [count, setCount] = useState(0);
  const hoverRef = useRef(null);
  const inputRef = useRef(null);
  const logosRef = useRef(null);
  const isHovering = useHover(hoverRef);
  const [x, setX] = useLocalStorage('x');
  const [y, setY] = useCookie('y', '0');
  useClickOutside(logosRef, () => console.log('Clicked outside logos'));
  useKeyboard(() => alert('Search key pressed'), 'Command + K');
  useEscape(() => alert('Escape key pressed'));
  useCommandEnter(() => alert('Command + Enter pressed'));
  useCommandF(toggleFullscreen);

  return (
    <>
      <div ref={logosRef} className="border rounded-md">
        <h1>Click outside here</h1>
        <div>
          <Compute />
        </div>
        <div className="text-amber-400">
          <Nutrition />
        </div>
      </div>
      <h1 ref={hoverRef}>
        Vite + React <span>{isHovering && 'Hover'}</span>
      </h1>
      <div className="card">
        <button onClick={() => setCount(count => count + 1)}>count is {count}</button>
        <p>
          Edit <code className="text-brand">src/App.tsx</code> and save to test HMR
        </p>
        <p>
          App is currently <strong>{useOnlineStatus() ? 'online' : 'offline'}</strong>
        </p>
        <p>Hit command-F to toggle fullscreen</p>
      </div>
      <div className="read-the-docs">
        Click on the Vite and React logos to learn more&nbsp;
        <KbdEnter /> + <Kbd>Enter</Kbd>
        <div>
          <KbdCommand /> +&nbsp;
          <KbdOption /> +&nbsp;
          <KbdControl /> +&nbsp;
          <KbdShift /> +&nbsp;
          <KbdCapsLock /> +&nbsp;
          <KbdReturn /> +&nbsp;
          <KbdBackspace /> +&nbsp;
          <KbdDelete /> +&nbsp;
          <KbdEscape /> +&nbsp;
          <KbdPageUp /> +&nbsp;
          <KbdPageDown /> +&nbsp;
          <KbdEnd /> +&nbsp;
          <KbdHome /> +&nbsp;
          <KbdTab /> +&nbsp;
          <KbdBackTab /> +&nbsp;
          <KbdLeftArrow /> +&nbsp;
          <KbdRightArrow /> +&nbsp;
          <KbdUpArrow /> +&nbsp;
          <KbdDownArrow /> +&nbsp;
          <KbdEnter /> +&nbsp;
          <KbdSpace />
        </div>
      </div>
      <p className="read-the-docs">Local storage x is {x}</p>
      <p>Change local storage x below:</p>
      <input
        ref={inputRef}
        className="border"
        type="text"
        value={x || ''}
        onChange={e => setX(e.target.value)}
      />
      <p>Change cookie y below:</p>
      <input
        ref={inputRef}
        className="border"
        type="text"
        value={y || ''}
        onChange={e => setY(e.target.value)}
      />
      <div className="border rounded-md flex flex-col">
        <h1>Other pages</h1>
        <Link href="/useSearchParams">Search Params</Link>
        <Link href="/useVisibility">Visibility</Link>
      </div>
    </>
  );
}

export default Homepage;
