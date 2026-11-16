import { api } from '@/services/api/client';

export const searchApi = {
  /** filters: { query, senderId, from, to, hasAttachments }. Empty values are left out. */
  async messages(workspaceId, filters) {
    const params = { limit: 30 };
    if (filters.query) params.q = filters.query;
    if (filters.senderId) params.senderId = filters.senderId;
    if (filters.from) params.from = filters.from;
    if (filters.to) params.to = filters.to;
    if (filters.hasAttachments) params.attachments = '1';
    const { data } = await api.get(`/workspaces/${workspaceId}/search`, { params });
    return data.results;
  },
};
