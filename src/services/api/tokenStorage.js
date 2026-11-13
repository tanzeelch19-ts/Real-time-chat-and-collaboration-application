/**
 * Access-token storage. localStorage keeps the user signed in across tabs and
 * browser restarts. Swap this module for httpOnly cookies once the real backend
 * strategy is confirmed. Components never read the token directly.
 */
const TOKEN_KEY = 'chat.accessToken';

export function getAccessToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAccessToken(token) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Storage unavailable; the session lasts only until a reload.
  }
}

export function clearAccessToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Storage unavailable; nothing to clear.
  }
}