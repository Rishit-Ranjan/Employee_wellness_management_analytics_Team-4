const API_BASE = '/api'; // Use Vite proxy in development

async function request(path, opts = {}) {
  const res = await fetch(API_BASE + path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    ...opts,
  });

  if (!res.ok) {
    let body = null;
    try { body = await res.json(); } catch { /* ignore */ }
    const message = (body && (body.message || body.detail)) ? (body.message || body.detail) : res.statusText;
    const err = new Error(message || 'Request failed');
    err.status = res.status;
    throw err;
  }

  try { return await res.json(); } catch { return null; }
}

export function login(email, password) {
  return request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
}

export function me() { return request('/auth/me'); }

export default { login, me };