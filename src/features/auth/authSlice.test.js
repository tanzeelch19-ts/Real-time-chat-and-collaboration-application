import { configureStore } from '@reduxjs/toolkit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import authReducer, {
  loginUser,
  logoutUser,
  selectAuthError,
  selectIsAuthenticated,
  selectSessionExpiredReason,
  sessionExpired,
} from '@/features/auth/authSlice';
import { authApi } from '@/features/auth/authApi';
import { ApiClientError } from '@/services/api/errors';

vi.mock('@/features/auth/authApi', () => ({
  authApi: { login: vi.fn(), logout: vi.fn(), fetchCurrentUser: vi.fn() },
}));

const makeStore = () => configureStore({ reducer: { auth: authReducer } });

describe('auth slice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('stores the access token and marks the user authenticated on login', async () => {
    authApi.login.mockResolvedValue({ user: { id: '1', displayName: 'Ayesha' }, accessToken: 'tok-123' });
    const store = makeStore();

    await store.dispatch(loginUser({ email: 'owner@demo.test', password: 'Password123!' }));

    expect(selectIsAuthenticated(store.getState())).toBe(true);
    expect(localStorage.getItem('chat.accessToken')).toBe('tok-123');
  });

  it('stores a serializable error when login fails', async () => {
    authApi.login.mockRejectedValue(
      new ApiClientError({ status: 401, code: 'INVALID_CREDENTIALS', message: 'Email or password is incorrect.' }),
    );
    const store = makeStore();

    await store.dispatch(loginUser({ email: 'owner@demo.test', password: 'wrong' }));

    expect(selectIsAuthenticated(store.getState())).toBe(false);
    expect(selectAuthError(store.getState())).toMatchObject({ code: 'INVALID_CREDENTIALS' });
  });

  it('sessionExpired signs the user out and records the reason', () => {
    const store = makeStore();

    store.dispatch(sessionExpired());

    expect(store.getState().auth.status).toBe('anonymous');
    expect(selectSessionExpiredReason(store.getState())).toBe('expired');
  });

  it('clears the local session even when the logout request fails', async () => {
    localStorage.setItem('chat.accessToken', 'tok-123');
    authApi.logout.mockRejectedValue(new Error('network down'));
    const store = makeStore();

    await store.dispatch(logoutUser());

    expect(localStorage.getItem('chat.accessToken')).toBeNull();
    expect(store.getState().auth.status).toBe('anonymous');
  });
});