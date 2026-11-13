import { api } from '@/services/api/client';

export const preferencesApi = {
  /** Notification kinds the user has on: { mentions, replies, direct }. */
  async get() {
    const { data } = await api.get('/users/me/notifications');
    return data.preferences;
  },
  async save(values) {
    const { data } = await api.patch('/users/me/notifications', values);
    return data.preferences;
  },
};