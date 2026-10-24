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

  return res;
}
