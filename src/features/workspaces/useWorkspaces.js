import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { workspacesApi } from '@/features/workspaces/workspacesApi';

/** Query keys in one place, so invalidation stays consistent. */
export const workspaceKeys = {
  list: () => ['workspaces', 'list'],
  detail: (workspaceId) => ['workspaces', 'detail', workspaceId],
  members: (workspaceId) => ['workspaces', workspaceId, 'members'],
  invitations: (workspaceId) => ['workspaces', workspaceId, 'invitations'],
  invitationPreview: (token) => ['invitations', 'preview', token],
};

export function useWorkspaces() {
  return useQuery({
    queryKey: workspaceKeys.list(),
    queryFn: () => workspacesApi.list(),
  });
}

export function useWorkspace(workspaceId) {
  return useQuery({
    queryKey: workspaceKeys.detail(workspaceId),
    queryFn: () => workspacesApi.get(workspaceId),
    enabled: Boolean(workspaceId),
  });
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name) => workspacesApi.create(name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: workspaceKeys.list() }),
  });
}

export function useRenameWorkspace(workspaceId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name) => workspacesApi.rename(workspaceId, name),
    onSuccess: (workspace) => {
      queryClient.setQueryData(workspaceKeys.detail(workspaceId), workspace);
      return queryClient.invalidateQueries({ queryKey: workspaceKeys.list() });
    },
  });
}

export function useDeleteWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (workspaceId) => workspacesApi.remove(workspaceId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: workspaceKeys.list() }),
  });
}

export function useMembers(workspaceId) {
  return useQuery({
    queryKey: workspaceKeys.members(workspaceId),
    queryFn: () => workspacesApi.listMembers(workspaceId),
    enabled: Boolean(workspaceId),
  });
}

export function useChangeMemberRole(workspaceId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }) => workspacesApi.changeMemberRole(workspaceId, userId, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: workspaceKeys.members(workspaceId) }),
  });
}

export function useRemoveMember(workspaceId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId) => workspacesApi.removeMember(workspaceId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.members(workspaceId) });
      return queryClient.invalidateQueries({ queryKey: workspaceKeys.list() });
    },
  });
}

export function useInvitations(workspaceId) {
  return useQuery({
    queryKey: workspaceKeys.invitations(workspaceId),
    queryFn: () => workspacesApi.listInvitations(workspaceId),
    enabled: Boolean(workspaceId),
  });
}

export function useCreateInvitation(workspaceId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (role) => workspacesApi.createInvitation(workspaceId, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: workspaceKeys.invitations(workspaceId) }),
  });
}

export function useRevokeInvitation(workspaceId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (token) => workspacesApi.revokeInvitation(workspaceId, token),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: workspaceKeys.invitations(workspaceId) }),
  });
}

export function useInvitationPreview(token) {
  return useQuery({
    queryKey: workspaceKeys.invitationPreview(token),
    queryFn: () => workspacesApi.previewInvitation(token),
    enabled: Boolean(token),
    retry: false,
  });
}

export function useAcceptInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (token) => workspacesApi.acceptInvitation(token),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: workspaceKeys.list() }),
  });
}