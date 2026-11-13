import { api } from '@/services/api/client';

/** Every endpoint the auth and profile screens use. Shapes follow the mock server. */
export const authApi = {
  async register(payload) {
    const { data } = await api.post('/auth/register', payload);
    return data;
  },
  async login(payload) {
    const { data } = await api.post('/auth/login', payload);
    return data;
  },
  async logout() {
    await api.post('/auth/logout');
  },
  async requestPasswordReset(email) {
    const { data } = await api.post('/auth/forgot-password', { email });
    return data;
  },
  async resetPassword(payload) {
    await api.post('/auth/reset-password', payload);
  },
  async fetchCurrentUser() {
    const { data } = await api.get('/users/me');
    return data.user;
  },
  async updateCurrentUser(patch) {
    const { data } = await api.patch('/users/me', patch);
    return data.user;
  },
};