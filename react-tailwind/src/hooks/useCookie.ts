import { useState } from 'react';
import { getCookie, setCookie } from '@/utils/cookies';

function useCookie(name: string, initialValue: string, path = '/') {
  const [cookie, setCookieValue] = useState(() => getCookie(name) ?? initialValue);

  const updateCookie = (value: string) => {
    setCookie(name, value, path);
    setCookieValue(value);
  };

  return [cookie, updateCookie] as const;
}

export default useCookie;
