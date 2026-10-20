// AI ASSISTANCE: Drafted with Claude (Anthropic) and reviewed by Bobby Hughes.
// =============================================================================
// Load data from the server - Shared (integration: Bobby)
// =============================================================================
// WHAT IT DOES
//   useApi(load) runs a request when a page opens and gives back
//   { data, error, loading, reload }. Call reload() after saving to refresh.
//
// HOW IT CONNECTS
//   - Pages pass one of the lib/api/*.ts functions, e.g. useApi(getSchedule).
//   - A "hook" is a function starting with use... that lets a component keep state.
// =============================================================================

import { useEffect, useState } from 'react';
import { errorMessage } from '@/lib/api/client';

/**
 * Load data from the API when a page opens (and again when `deps` change).
 * Returns { data, error, loading, reload }. Call reload() after saving to refresh.
 */
export function useApi<T>(load: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true; // ignore answers that arrive after the page has moved on
    setLoading(true);
    load()
      .then((result) => {
        if (active) {
          setData(result);
          setError('');
        }
      })
      .catch((err) => active && setError(errorMessage(err)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version]);

  return { data, error, loading, reload: () => setVersion((v) => v + 1) };
}
