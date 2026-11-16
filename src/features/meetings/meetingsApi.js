import { api } from '@/services/api/client';

const roomPath = (roomId) => `/rooms/${encodeURIComponent(roomId)}`;

/** The provider is not connected yet, so meetings have no join link. */
export const meetingsApi = {
  async list(roomId) {
    const { data } = await api.get(`${roomPath(roomId)}/meetings`);
    return data.meetings;
  },
  async start(roomId) {
    const { data } = await api.post(`${roomPath(roomId)}/meetings`);
    return data.meeting;
  },
  async end(meetingId) {
    const { data } = await api.post(`/meetings/${encodeURIComponent(meetingId)}/end`);
    return data.meeting;
  },
};
