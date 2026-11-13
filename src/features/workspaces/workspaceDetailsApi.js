import { api } from '@/services/api/client';

export const workspaceDetailsApi = {
  /** Owner only. Send any of name, description, and avatarUrl. */
  async update(workspaceId, patch) {
    const { data } = await api.patch(`/workspaces/${workspaceId}`, patch);
    return data.workspace;
  },
};