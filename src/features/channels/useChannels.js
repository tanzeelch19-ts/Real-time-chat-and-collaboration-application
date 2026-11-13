import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { channelsApi } from '@/features/channels/channelsApi';

export const channelKeys = {
  list: (workspaceId) => ['channels', workspaceId, 'list'],
  members: (workspaceId, channelId) => ['channels', workspaceId, 'members', channelId],
};

export function useChannels(workspaceId) {
  return useQuery({
    queryKey: channelKeys.list(workspaceId),
    queryFn: () => channelsApi.list(workspaceId),
    enabled: Boolean(workspaceId),
  });
}

export function useChannelMembers(workspaceId, channelId) {
  return useQuery({
    queryKey: channelKeys.members(workspaceId, channelId),
    queryFn: () => channelsApi.members(workspaceId, channelId),
    enabled: Boolean(workspaceId && channelId),
  });
}

export function useCreateChannel(workspaceId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values) => channelsApi.create(workspaceId, values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: channelKeys.list(workspaceId) }),
  });
}

export function useAddChannelMember(workspaceId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ channelId, userId }) => channelsApi.addMember(workspaceId, channelId, userId),
    onSuccess: (_data, { channelId }) =>
      queryClient.invalidateQueries({ queryKey: channelKeys.members(workspaceId, channelId) }),
  });
}

export function useRemoveChannelMember(workspaceId, channelId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId) => channelsApi.removeMember(workspaceId, channelId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: channelKeys.members(workspaceId, channelId) });
      queryClient.invalidateQueries({ queryKey: channelKeys.list(workspaceId) });
    },
  });
}

export function useJoinChannel(workspaceId, channelId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => channelsApi.join(workspaceId, channelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: channelKeys.members(workspaceId, channelId) });
      queryClient.invalidateQueries({ queryKey: channelKeys.list(workspaceId) });
    },
  });
}

export function useUpdateChannel(workspaceId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ channelId, patch }) => channelsApi.update(workspaceId, channelId, patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: channelKeys.list(workspaceId) }),
  });
}

/** Mute or unmute a room for this user. Muted rooms send no notifications. */
export function useSetMuted(workspaceId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roomId, muted }) => channelsApi.setMuted(roomId, muted),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: channelKeys.list(workspaceId) }),
  });
}