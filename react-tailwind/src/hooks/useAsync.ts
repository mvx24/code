import { useState, useEffect, useCallback, DependencyList } from 'react';

type AsyncFn<T> = () => Promise<T>;
type AsyncResult<T> = {
  data: T | null;
  error: Error | null;
  loading: boolean;
  run: () => Promise<void>;
};

function useAsync<T>(fn: AsyncFn<T>, deps?: DependencyList): AsyncResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fn();
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, deps || []);

  useEffect(() => {
    run();
  }, [run]);

  return { data, error, loading, run };
}

export default useAsync;
