import { api } from '@/services/api/client';

export const channelsApi = {
  /** Only the channels this user may see. Each includes unreadCount and muted. */
  async list(workspaceId) {
    const { data } = await api.get(`/workspaces/${workspaceId}/channels`);
    return data.channels;
  },
  async create(workspaceId, { name, visibility }) {
    const { data } = await api.post(`/workspaces/${workspaceId}/channels`, { name, visibility });
    return data.channel;
  },
  async members(workspaceId, channelId) {
    const { data } = await api.get(`/workspaces/${workspaceId}/channels/${channelId}/members`);
    return data.members;
  },
  async addMember(workspaceId, channelId, userId) {
    const { data } = await api.post(`/workspaces/${workspaceId}/channels/${channelId}/members`, { userId });
    return data;
  },
  async removeMember(workspaceId, channelId, userId) {
    await api.delete(`/workspaces/${workspaceId}/channels/${channelId}/members/${userId}`);
  },
  async join(workspaceId, channelId) {
    const { data } = await api.post(`/workspaces/${workspaceId}/channels/${channelId}/join`);
    return data;
  },
  async update(workspaceId, channelId, patch) {
    const { data } = await api.patch(`/workspaces/${workspaceId}/channels/${channelId}`, patch);
    return data.channel;
  },
  async setMuted(roomId, muted) {
    const { data } = await api.put(`/rooms/${encodeURIComponent(roomId)}/mute`, { muted });
    return data.muted;
  },
};