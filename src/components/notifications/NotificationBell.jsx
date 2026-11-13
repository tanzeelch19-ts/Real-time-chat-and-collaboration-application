import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AtSign, Bell, CheckCheck, CornerDownRight, MessageSquare } from 'lucide-react';
import Button from '@/components/common/Button';
import { SkeletonList } from '@/components/common/Skeleton';
import {
  useMarkNotificationRead,
  useNotificationList,
  useNotificationSocketSync,
  useNotificationSummary,
  useReadAllNotifications,
} from '@/features/notifications/useNotifications';
import { cn } from '@/utils/cn';

const KIND = {
  mention: { label: 'mentioned you', icon: AtSign },
  reply: { label: 'replied to you', icon: CornerDownRight },
  direct: { label: 'sent you a message', icon: MessageSquare },
};

/** Channel or DM route for a room id such as "channel:<id>" or "conversation:<id>". */
function pathFor(notification) {
  const separator = notification.roomId.indexOf(':');
  const kind = notification.roomId.slice(0, separator);
  const id = notification.roomId.slice(separator + 1);
  const base = `/w/${notification.workspaceId}`;
  return kind === 'conversation' ? `${base}/dm/${id}` : `${base}/channels/${id}`;
}

export default function NotificationBell() {
  const navigate = useNavigate();
  const { workspaceId } = useParams();
  const { data: summary } = useNotificationSummary();
  const { error } = useNotificationList(false);
  const [open, setOpen] = useState(false);
  const listQuery = useNotificationList(open);
  const markRead = useMarkNotificationRead();
  const readAll = useReadAllNotifications(workspaceId);
  const rootRef = useRef(null);
  const total = summary?.total ?? 0;

  useNotificationSocketSync();

  // Close the panel on an outside click or Escape.
  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const list = listQuery.data;

  return (
    <div ref={rootRef} className="relative">
      <Button
        variant="ghost"
        size="icon"
        aria-label={total ? `Notifications, ${total} unread` : 'Notifications'}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="relative"
      >
        <Bell size={18} aria-hidden="true" />
        {total > 0 && (
          <span
            aria-hidden="true"
            className="absolute -right-1 -top-1 z-10 flex h-4 min-w-4 ring-2 ring-white dark:ring-slate-900 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold leading-none text-white"
          >
            {total > 99 ? '99+' : total}
          </span>
        )}
      </Button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 top-full z-50 mt-2 w-80 max-w-[90vw] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900"
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2 dark:border-slate-800">
            <h2 className="text-sm font-semibold">Notifications</h2>
            {total > 0 && (
              <button
                type="button"
                onClick={() => readAll.mutate()}
                className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline dark:text-brand-300"
              >
                <CheckCheck size={14} aria-hidden="true" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {listQuery.isPending && (
              <div className="p-3">
                <SkeletonList rows={3} label="Loading notifications" />
              </div>
            )}
            {listQuery.isError && (
              <p role="alert" className="p-4 text-sm text-red-600 dark:text-red-400">
                {error?.message ?? 'Could not load notifications.'}
              </p>
            )}
            {list && list.length === 0 && (
              <p className="p-4 text-sm text-slate-500 dark:text-slate-400">You are all caught up.</p>
            )}
            {list && list.length > 0 && (
              <ul>
                {list.map((notification) => {
                  const meta = KIND[notification.kind] ?? KIND.direct;
                  const Icon = meta.icon;
                  return (
                    <li key={notification.id}>
                      <button
                        type="button"
                        onClick={() => {
                          markRead.mutate(notification.id);
                          setOpen(false);
                          navigate(pathFor(notification));
                        }}
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
                          <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                            {notification.preview}
                          </span>
                          <time dateTime={notification.createdAt} className="text-[11px] text-slate-400">
                            {new Date(notification.createdAt).toLocaleString()}
                          </time>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}