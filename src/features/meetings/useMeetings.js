import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { meetingsApi } from '@/features/meetings/meetingsApi';

export const meetingKeys = {
  room: (roomId) => ['meetings', roomId],
};

export function useRoomMeetings(roomId) {
  return useQuery({
    queryKey: meetingKeys.room(roomId),
    queryFn: () => meetingsApi.list(roomId),
    enabled: Boolean(roomId),
  });
}

export function useStartMeeting(roomId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => meetingsApi.start(roomId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: meetingKeys.room(roomId) }),
  });
}

export function useEndMeeting(roomId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (meetingId) => meetingsApi.end(meetingId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: meetingKeys.room(roomId) }),
  });
}
