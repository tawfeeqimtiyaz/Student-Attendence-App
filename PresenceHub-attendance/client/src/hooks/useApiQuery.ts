// ============================================
// useApiQuery — fetch state for a single resource
// Each resource owns its loading/error state, so one failing request
// never leaves another view spinning, and every view can offer "Retry".
// ============================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { getErrorMessage } from '../utils/errors';

interface QueryState<T> {
  data: T | undefined;
  error: string | null;
  isLoading: boolean;
}

export interface ApiQuery<T> extends QueryState<T> {
  /** Re-run the request. Resolves with the fresh data (or undefined on error). */
  reload: () => Promise<T | undefined>;
}

/**
 * @param fetcher returns the payload. Pass `null` to skip (e.g. until a selection exists).
 * @param deps re-fetch when these change.
 */
export function useApiQuery<T>(fetcher: (() => Promise<T>) | null, deps: unknown[]): ApiQuery<T> {
  const [state, setState] = useState<QueryState<T>>({
    data: undefined,
    error: null,
    isLoading: fetcher !== null,
  });
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const requestId = useRef(0);

  const run = useCallback(async (resetData: boolean) => {
    const current = fetcherRef.current;
    const id = ++requestId.current;
    if (!current) {
      setState({ data: undefined, error: null, isLoading: false });
      return undefined;
    }
    // A new query (deps changed) must not show the previous query's data.
    setState((prev) => ({ data: resetData ? undefined : prev.data, error: null, isLoading: true }));
    try {
      const data = await current();
      if (id === requestId.current) setState({ data, error: null, isLoading: false });
      return data;
    } catch (err) {
      if (id === requestId.current) {
        setState((prev) => ({ ...prev, error: getErrorMessage(err, 'Could not load data.'), isLoading: false }));
      }
      return undefined;
    }
  }, []);

  useEffect(() => {
    run(true);
    // Ignore responses from requests superseded by an unmount.
    return () => {
      requestId.current++;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const reload = useCallback(() => run(false), [run]);

  // Between a deps change and the effect firing, report loading rather than "empty".
  const pending = fetcher !== null && state.data === undefined && state.error === null;
  return { ...state, isLoading: state.isLoading || pending, reload };
}
