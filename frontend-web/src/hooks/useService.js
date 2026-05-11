// src/hooks/useService.js
// Generic hook to call any service function and manage loading/error state.
import { useState, useEffect, useCallback } from 'react';

export function useService(serviceFn, deps = []) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await serviceFn();
      setData(res.data);
    } catch (err) {
      setError(err?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch, setData };
}

export function useAction() {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const execute = useCallback(async (actionFn, onSuccess) => {
    setLoading(true);
    setError(null);
    try {
      const res = await actionFn();
      if (onSuccess) onSuccess(res.data);
      return res.data;
    } catch (err) {
      setError(err?.message || 'Action failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { execute, loading, error };
}
