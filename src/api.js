import { API_BASE } from './config';

// Single place where the auth token is attached to a request. The /student and /ai
// routers both require a valid JWT, so every call to them has to carry one.

function readToken() {
  try {
    return localStorage.getItem('token');
  } catch {
    // Private mode / blocked storage — treat as signed out rather than throwing.
    return null;
  }
}

let unauthorizedHandler = null;

// App.jsx registers its logout function here so an expired or rejected token drops
// the user back to the sign-in screen instead of leaving the UI silently broken.
export function setUnauthorizedHandler(fn) {
  unauthorizedHandler = fn;
}

export async function apiFetch(path, options = {}) {
  const token = readToken();
  const headers = { ...(options.headers || {}) };

  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    if (unauthorizedHandler) unauthorizedHandler();
    throw new Error('Your session has expired. Please sign in again.');
  }

  // Rate limits carry a message the student needs to read (which limit, when it
  // frees up), so surface the server's own wording rather than a generic error.
  if (res.status === 429) {
    const err = new Error(await messageFrom(res, 'You have made too many requests. Please wait a little and try again.'));
    err.rateLimited = true;
    throw err;
  }

  return res;
}

async function messageFrom(res, fallback) {
  try {
    const body = await res.json();
    return body?.error || body?.message || fallback;
  } catch {
    // Non-JSON body (proxy error page, empty response).
    return fallback;
  }
}

// For the endpoints that return JSON on success and { error } on failure. Without
// this, callers that went straight to res.json() rendered the error body as if it
// were real data — a rate-limited paper request became a blank mock test.
export async function apiJson(path, options = {}) {
  const res = await apiFetch(path, options);
  if (!res.ok) {
    throw new Error(await messageFrom(res, `Request failed (${res.status})`));
  }
  return res.json();
}
