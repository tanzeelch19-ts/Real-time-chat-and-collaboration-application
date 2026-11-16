/**
 * Access-token storage. sessionStorage keeps each browser window or tab signed in separately:
 * a new window starts signed out, and a refresh keeps the session. Swap this module for
 * httpOnly cookies once the real backend strategy is confirmed.
 */
const TOKEN_KEY = 'chat.accessToken';

export function getAccessToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAccessToken(token) {
  try {
    sessionStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Storage unavailable; the session lasts only until a reload.
  }
}

export function clearAccessToken() {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Storage unavailable; nothing to clear.
  }
}