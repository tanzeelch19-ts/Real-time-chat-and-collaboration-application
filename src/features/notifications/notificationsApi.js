import { api } from '@/services/api/client';

export const notificationsApi = {
  async summary() {
    const { data } = await api.get('/notifications/summary');
    return data;
  },
  /** The recent notifications as a plain array (used by the bell). */
  async list() {
    const { data } = await api.get('/notifications', { params: { limit: 30 } });
    return data.notifications;
  },
  /** The full page: notifications plus the unread count. */
  async page({ unreadOnly = false, limit = 100 } = {}) {
    const params = { limit };
    if (unreadOnly) params.unread = 1;
    const { data } = await api.get('/notifications', { params });
    return data;
  },
  async markRead(notificationId) {
    await api.post(`/notifications/${encodeURIComponent(notificationId)}/read`);
  },
  async readRoom(roomId) {
    await api.post('/notifications/read-room', { roomId });
  },
  async readAll(workspaceId) {
    await api.post('/notifications/read-all', { workspaceId });
  },
};