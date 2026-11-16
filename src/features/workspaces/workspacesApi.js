import { api } from '@/services/api/client';

/** Workspaces, members, and invitations. Shapes follow the mock server routes. */
export const workspacesApi = {
  async list() {
    const { data } = await api.get('/workspaces');
    return data.workspaces;
  },
  async create(name) {
    const { data } = await api.post('/workspaces', { name });
    return data.workspace;
  },
  async get(workspaceId) {
    const { data } = await api.get(`/workspaces/${workspaceId}`);
    return data.workspace;
  },
  async rename(workspaceId, name) {
    const { data } = await api.patch(`/workspaces/${workspaceId}`, { name });
    return data.workspace;
  },
  async remove(workspaceId) {
    await api.delete(`/workspaces/${workspaceId}`);
  },

  async listMembers(workspaceId) {
    const { data } = await api.get(`/workspaces/${workspaceId}/members`);
    return data.members;
  },
  async changeMemberRole(workspaceId, userId, role) {
    const { data } = await api.patch(`/workspaces/${workspaceId}/members/${userId}`, { role });
    return data.member;
  },
  /** Used both to remove someone else and to leave yourself. */
  async removeMember(workspaceId, userId) {
    await api.delete(`/workspaces/${workspaceId}/members/${userId}`);
  },

  async listInvitations(workspaceId) {
    const { data } = await api.get(`/workspaces/${workspaceId}/invitations`);
    return data.invitations;
  },
  async createInvitation(workspaceId, role) {
    const { data } = await api.post(`/workspaces/${workspaceId}/invitations`, { role });
    return data.invitation;
  },
  async revokeInvitation(workspaceId, token) {
    await api.delete(`/workspaces/${workspaceId}/invitations/${token}`);
  },
  /** Public preview shown before the user accepts. */
  async previewInvitation(token) {
    const { data } = await api.get(`/invitations/${token}`);
    return data.invitation;
  },
  async acceptInvitation(token) {
    const { data } = await api.post(`/invitations/${token}/accept`);
    return data;
  },
};
