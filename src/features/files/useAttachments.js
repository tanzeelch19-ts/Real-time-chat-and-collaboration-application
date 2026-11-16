import { useMutation, useQueryClient } from '@tanstack/react-query';
import { validateFileForUpload } from '@/features/files/fileRules';
import { filesApi } from '@/features/files/filesApi';
import { mergeIncomingMessage } from '@/features/messages/messagesCache';
import { messageKeys } from '@/features/messages/useMessages';

export function useUploadAttachment(roomId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, caption, onProgress }) => {
      const problem = validateFileForUpload(file);
      if (problem) throw new Error(problem);
      return filesApi.upload(roomId, file, caption, onProgress);
    },
    onSuccess: (message) => {
      queryClient.setQueryData(messageKeys.room(roomId), (data) => mergeIncomingMessage(data, message));
    },
  });
}
