import { useCallback } from 'react';
import { useSearchParams } from 'wouter';

function useSearchParam(name: string, replace = true): [string, (value: string) => void] {
  const [searchParams, setSearchParams] = useSearchParams();
  return [
    searchParams.get(name) || '',
    useCallback(
      (value?: string) =>
        setSearchParams(
          prev => {
            const newParams = new URLSearchParams(prev);
            if (!value) {
              newParams.delete(name);
            } else {
              newParams.set(name, value);
            }
            return newParams;
          },
          { replace },
        ),
      [name, replace, setSearchParams],
    ),
  ];
}

export default useSearchParam;
