import { api } from '@/services/api/client';

export const auditApi = {
  /** Owners and admins only. The server enforces this too. */
  async list(workspaceId) {
    const { data } = await api.get(`/workspaces/${workspaceId}/audit`, { params: { limit: 100 } });
    return data.entries;
  },
};
