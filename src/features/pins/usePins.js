import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { pinsApi } from '@/features/pins/pinsApi';

export const pinKeys = {
  pinned: (roomId) => ['pins', roomId],
  saved: ['saved'],
};

export function usePinnedMessages(roomId) {
  return useQuery({
    queryKey: pinKeys.pinned(roomId),
    queryFn: () => pinsApi.listPinned(roomId),
    enabled: Boolean(roomId),
  });
}

export function useSavedMessages() {
  return useQuery({
    queryKey: pinKeys.saved,
    queryFn: () => pinsApi.listSaved(),
  });
}

export function useTogglePin(roomId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (messageId) => pinsApi.togglePin(roomId, messageId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: pinKeys.pinned(roomId) }),
  });
}

export function useToggleSave(roomId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (messageId) => pinsApi.toggleSave(roomId, messageId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: pinKeys.saved }),
  });
}
