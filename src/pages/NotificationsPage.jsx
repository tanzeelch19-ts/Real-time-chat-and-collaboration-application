import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AtSign, Bell, CheckCheck, CornerDownRight, Hash, MessageSquare, UserPlus } from 'lucide-react';
import Button from '@/components/common/Button';
import EmptyState from '@/components/common/EmptyState';
import { SkeletonList } from '@/components/common/Skeleton';
import FormAlert from '@/components/forms/FormAlert';
import { notificationsApi } from '@/features/notifications/notificationsApi';
import {
  notificationKeys,
  useMarkNotificationRead,
  useReadAllNotifications,
} from '@/features/notifications/useNotifications';
import { toSerializableError } from '@/services/api/errors';
import { cn } from '@/utils/cn';

const KIND = {
  mention: { label: 'mentioned you', icon: AtSign },
  reply: { label: 'replied to you', icon: CornerDownRight },
  direct: { label: 'sent you a message', icon: MessageSquare },
  invitation: { label: 'joined your workspace', icon: UserPlus },
  channel: { label: 'added you to a channel', icon: Hash },
};

const TIME = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });

function pathFor(workspaceId, roomId) {
  const separator = roomId.indexOf(':');
  const kind = roomId.slice(0, separator);
  const id = roomId.slice(separator + 1);
  const base = `/w/${workspaceId}`;
  return kind === 'conversation' ? `${base}/dm/${id}` : `${base}/channels/${id}`;
}

export default function NotificationsPage() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const [unreadOnly, setUnreadOnly] = useState(false);
  const markRead = useMarkNotificationRead();
  const readAll = useReadAllNotifications(workspaceId);

  const { data, isPending, isError, error } = useQuery({
    queryKey: [...notificationKeys.all, 'page', unreadOnly],
    queryFn: () => notificationsApi.page({ unreadOnly }),
  });

  // The server returns every workspace's notifications, so keep only this one.
  const items = (data?.notifications ?? []).filter((n) => n.workspaceId === workspaceId);
  const unreadHere = items.filter((n) => !n.readAt).length;

  const open = (notification) => {
    if (!notification.readAt) markRead.mutate(notification.id);
    navigate(
      notification.roomId ? pathFor(workspaceId, notification.roomId) : '/w/' + workspaceId + '/settings',
    );
  };

  return (
    <div className="mx-auto h-full w-full max-w-3xl space-y-6 overflow-y-auto px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Mentions, replies, and direct messages for this workspace.
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => readAll.mutate()}
          disabled={unreadHere === 0 || readAll.isPending}
        >
          <CheckCheck size={16} aria-hidden="true" />
          Mark all read
        </Button>
      </header>

      <div role="group" aria-label="Filter notifications" className="flex gap-2">
        {[
          { value: false, label: 'All' },
          { value: true, label: 'Unread' },
        ].map((option) => (
          <button
            key={option.label}
            type="button"
            aria-pressed={unreadOnly === option.value}
            onClick={() => setUnreadOnly(option.value)}
            className={cn(
              'rounded-full border px-3 py-1 text-sm',
              unreadOnly === option.value
                ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300'
                : 'border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800',
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {isError && <FormAlert>{toSerializableError(error).message}</FormAlert>}
      {isPending && <SkeletonList rows={4} label="Loading notifications" />}

      {!isPending && items.length === 0 && (
        <EmptyState
          icon={Bell}
          title={unreadOnly ? 'No unread notifications' : 'No notifications yet'}
          description="When someone mentions you or sends you a message, it appears here."
        />
      )}

      {items.length > 0 && (
        <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
          {items.map((notification) => {
            const meta = KIND[notification.kind] ?? KIND.direct;
            const Icon = meta.icon;
            return (
              <li key={notification.id}>
                <button
                  type="button"
                  onClick={() => open(notification)}
                  className={cn(
                    'flex w-full gap-3 px-4 py-3 text-left hover:bg-slate-100 dark:hover:bg-slate-800',
                    !notification.readAt && 'bg-brand-50/60 dark:bg-brand-500/10',
                  )}
                >
                  <Icon size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-slate-400" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm">
                      <span className="font-medium">{notification.actor.displayName}</span> {meta.label}
                    </span>
                    <span className="block truncate text-sm text-slate-600 dark:text-slate-300">
                      {notification.preview}
                    </span>
                    <time dateTime={notification.createdAt} className="text-xs text-slate-400">
                      {TIME.format(new Date(notification.createdAt))}
                    </time>
                  </span>
                  {!notification.readAt && (
                    <span aria-label="Unread" className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-600" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
