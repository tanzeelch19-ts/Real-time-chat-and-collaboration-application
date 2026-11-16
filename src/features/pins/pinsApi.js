import { api } from '@/services/api/client';

const roomPath = (roomId) => `/rooms/${encodeURIComponent(roomId)}`;

export const pinsApi = {
  async listPinned(roomId) {
    const { data } = await api.get(`${roomPath(roomId)}/pins`);
    return data.messages;
  },
  /** Returns true when the message is now pinned. */
  async togglePin(roomId, messageId) {
    const { data } = await api.post(`${roomPath(roomId)}/messages/${messageId}/pin`);
    return data.pinned;
  },
  /** Returns true when the message is now saved for this user. */
  async toggleSave(roomId, messageId) {
    const { data } = await api.post(`${roomPath(roomId)}/messages/${messageId}/save`);
    return data.saved;
  },
  async listSaved() {
    const { data } = await api.get('/saved');
    return data.messages;
  },
};
