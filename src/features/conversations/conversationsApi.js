import { api } from '@/services/api/client';

export const conversationsApi = {
  async list(workspaceId) {
    const { data } = await api.get('/conversations', { params: { workspaceId } });
    return data.conversations;
  },
  /** One other person opens (or reuses) a direct message. Two or more create a group. */
  async open({ workspaceId, userIds, name }) {
    const { data } = await api.post('/conversations', { workspaceId, userIds, name });
    return data.conversation;
  },
};