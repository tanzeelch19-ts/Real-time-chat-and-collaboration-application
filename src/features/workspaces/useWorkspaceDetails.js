import { useMutation, useQueryClient } from '@tanstack/react-query';
import { workspaceDetailsApi } from '@/features/workspaces/workspaceDetailsApi';

export function useUpdateWorkspaceDetails(workspaceId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch) => workspaceDetailsApi.update(workspaceId, patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workspaces'] }),
  });
}
