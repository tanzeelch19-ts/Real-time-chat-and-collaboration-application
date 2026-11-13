import { useState } from 'react';
import { Video, X } from 'lucide-react';
import Button from '@/components/common/Button';
import { SkeletonList } from '@/components/common/Skeleton';
import FormAlert from '@/components/forms/FormAlert';
import { useEndMeeting, useRoomMeetings, useStartMeeting } from '@/features/meetings/useMeetings';
import { toSerializableError } from '@/services/api/errors';

const TIME = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' });

/**
 * Running meetings in this room. The video provider is not connected yet, so meetings
 * have no join link. The host, an owner, or an admin can end a meeting.
 */
export default function MeetingPanel({ roomId, currentUserId, canModerate = false, onClose }) {
  const { data: meetings, isPending, isError, error } = useRoomMeetings(roomId);
  const start = useStartMeeting(roomId);
  const end = useEndMeeting(roomId);
  const [actionError, setActionError] = useState(null);

  const run = async (action) => {
    setActionError(null);
    try {
      await action();
    } catch (err) {
      setActionError(toSerializableError(err).message);
    }
  };

  return (
    <section
      aria-label="Meetings"
      className="max-h-72 shrink-0 overflow-y-auto border-b border-slate-200 bg-slate-50 px-6 py-3 dark:border-slate-800 dark:bg-slate-900/60"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Video size={14} aria-hidden="true" />
          Meetings
        </h2>
        <div className="flex items-center gap-2">
          <Button
            className="h-8 px-3"
            onClick={() => run(() => start.mutateAsync())}
            disabled={start.isPending}
          >
            {start.isPending ? 'Starting...' : 'Start meeting'}
          </Button>
          <Button variant="ghost" size="icon" aria-label="Close meetings" onClick={onClose}>
            <X size={16} aria-hidden="true" />
          </Button>
        </div>
      </div>

      {actionError && <FormAlert className="mb-2">{actionError}</FormAlert>}
      {isPending && <SkeletonList rows={1} label="Loading meetings" />}
      {isError && <FormAlert>{toSerializableError(error).message}</FormAlert>}
      {meetings && meetings.length === 0 && (
        <p className="text-sm text-slate-500 dark:text-slate-400">No meeting is running.</p>
      )}

      {meetings && meetings.length > 0 && (
        <ul className="space-y-2">
          {meetings.map((meeting) => {
            const canEnd = meeting.createdBy.id === currentUserId || canModerate;
            return (
              <li
                key={meeting.id}
                className="flex flex-wrap items-center gap-2 rounded-lg bg-white p-2 text-sm dark:bg-slate-950"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium">Meeting by {meeting.createdBy.displayName}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Started {TIME.format(new Date(meeting.createdAt))}
                  </p>
                  {meeting.joinUrl ? (
                    <a
                      href={meeting.joinUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-medium text-brand-600 hover:underline dark:text-brand-300"
                    >
                      Join meeting
                    </a>
                  ) : (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      No video provider connected yet.
                    </p>
                  )}
                </div>
                {canEnd && (
                  <Button
                    variant="secondary"
                    className="h-8 px-3"
                    onClick={() => run(() => end.mutateAsync(meeting.id))}
                    disabled={end.isPending}
                  >
                    End
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}