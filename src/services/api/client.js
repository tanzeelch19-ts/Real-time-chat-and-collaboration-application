import axios from 'axios';
import { getAccessToken } from '@/services/api/tokenStorage';
import { normalizeError } from '@/services/api/errors';

/** Auth calls where a 401 means "wrong credentials", not "session expired". */
const PUBLIC_AUTH_PATHS = ['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password'];

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

let unauthorizedHandler = () => {};

/** Registered by the store so a 401 anywhere signs the user out. */
export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const normalized = normalizeError(error);
    const path = error.config?.url ?? '';
    const isPublicAuthCall = PUBLIC_AUTH_PATHS.some((publicPath) => path.startsWith(publicPath));
    if (normalized.status === 401 && !isPublicAuthCall) {
      unauthorizedHandler(normalized);
    }
    return Promise.reject(normalized);
  },
);