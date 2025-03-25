import useVisibility from '@/hooks/useVisibility';
import { useState } from 'react';

function Visibility() {
  const [visible, setVisible] = useState(true);
  useVisibility(() => {
    setVisible(!document.hidden);
  }, [setVisible]);

  console.log(`Document is ${visible ? 'visible' : 'hidden'}`);

  return (
    <div>
      <h1>Visibility</h1>
      <div>Document is {visible ? 'visible' : 'hidden'}</div>
    </div>
  );
}

export default Visibility;
