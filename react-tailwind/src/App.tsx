import { useRef, useState } from 'react';

import { KbdEnter } from '@/components/Kbd';
import useHover from '@/hooks/useHover';
import useKeyboard from '@/hooks/useKeyboard';
import useCookie from '@/hooks/useCookie';
import { useLocalStorage } from '@/hooks/useStorage';
import reactLogo from '@/assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';

function App() {
  const [count, setCount] = useState(0);
  const hoverRef = useRef(null);
  const inputRef = useRef(null);
  const isHovering = useHover(hoverRef);
  const [x, setX] = useLocalStorage('x');
  const [y, setY] = useCookie('y', '0');
  useKeyboard(() => alert('Search key pressed'), { keys: 'k', modifiers: 'Meta' });

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1 ref={hoverRef}>
        Vite + React <span>{isHovering && 'Hover'}</span>
      </h1>
      <div className="card">
        <button onClick={() => setCount(count => count + 1)}>count is {count}</button>
        <p>
          Edit <code className="text-brand">src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
        <KbdEnter />
      </p>
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
    </>
  );
}

export default App;
