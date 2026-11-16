import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { conversationsApi } from '@/features/conversations/conversationsApi';

export const conversationKeys = {
  all: ['conversations'],
  list: (workspaceId) => ['conversations', workspaceId],
};

export function useConversations(workspaceId) {
  return useQuery({
    queryKey: conversationKeys.list(workspaceId),
    queryFn: () => conversationsApi.list(workspaceId),
    enabled: Boolean(workspaceId),
  });
}

export function useOpenConversation(workspaceId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userIds, name }) => conversationsApi.open({ workspaceId, userIds, name }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: conversationKeys.all }),
  });
}
