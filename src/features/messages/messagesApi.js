import { api } from '@/services/api/client';

const roomPath = (roomId) => `/rooms/${encodeURIComponent(roomId)}/messages`;

export const messagesApi = {
  async list(roomId, { before } = {}) {
    const params = before ? { before, limit: 30 } : { limit: 30 };
    const { data } = await api.get(roomPath(roomId), { params });
    return data;
  },
  async listThread(roomId, threadId) {
    const { data } = await api.get(roomPath(roomId), { params: { threadId, limit: 100 } });
    return data;
  },
  async send(roomId, body, threadId = null) {
    const { data } = await api.post(roomPath(roomId), { body, threadId });
    return data.message;
  },
  async edit(roomId, messageId, body) {
    const { data } = await api.patch(`${roomPath(roomId)}/${messageId}`, { body });
    return data.message;
  },
  async remove(roomId, messageId) {
    const { data } = await api.delete(`${roomPath(roomId)}/${messageId}`);
    return data.message;
  },
  async toggleReaction(roomId, messageId, emoji) {
    const { data } = await api.post(`${roomPath(roomId)}/${messageId}/reactions`, { emoji });
    return data.message;
  },
};