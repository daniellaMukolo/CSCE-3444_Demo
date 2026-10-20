// =============================================================================
// The one place that talks to the server - Shared (integration: Bobby)
// =============================================================================
// WHAT IT DOES
//   api(path, {method, body}) sends a request to /api/<path> and returns the JSON answer,
//   or throws an ApiError holding the server's message and field errors.
//
// HOW IT CONNECTS
//   - Every file in lib/api/ uses it. In development, Vite forwards /api to Flask on
//     port 5000 (see vite.config.ts), so the browser sees one address and the login
//     cookie works.
//   - Changes are always sent as JSON; the server rejects anything else (api/__init__.py).
//   - A 401 answer means the session ended; it tells AuthProvider so the login page shows.
// =============================================================================

/** Fired when the server says the session ended (401), so the app can show the login page. */
export const SESSION_ENDED_EVENT = 'wellness:session-ended';

/** An error response from the API. `data` holds its JSON, e.g. {errors: {...}} or {error: "..."}. */
export class ApiError extends Error {
  status: number;
  data: Record<string, any>;

  constructor(status: number, data: Record<string, any>) {
    super(data.error || 'Something went wrong. Please try again.');
    this.status = status;
    this.data = data;
  }
}

export async function api<T>(
  path: string,
  { method = 'GET', body }: { method?: string; body?: unknown } = {},
): Promise<T> {
  const sendsJson = method !== 'GET';
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      credentials: 'same-origin',
      // Changes are always sent as JSON; the server rejects anything else.
      headers: sendsJson ? { 'Content-Type': 'application/json' } : undefined,
      body: sendsJson ? JSON.stringify(body ?? {}) : undefined,
    });
  } catch {
    throw new ApiError(0, {
      error: 'Could not reach the server. Check that it is running and try again.',
    });
  }
  const data = await response.json().catch(() => ({}));
  if (response.status >= 500 && !data.error) {
    // In development this usually means the Flask server isn't running.
    data.error = 'The server isn’t responding. Check that the Flask server is running, then try again.';
  }
  if (!response.ok) {
    if (response.status === 401 && !path.startsWith('/auth/')) {
      window.dispatchEvent(new Event(SESSION_ENDED_EVENT));
    }
    throw new ApiError(response.status, data);
  }
  return data as T;
}

/** A readable message for any error. */
export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}
