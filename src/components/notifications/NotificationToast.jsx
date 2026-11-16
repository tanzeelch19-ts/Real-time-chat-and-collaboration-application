import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import Button from '@/components/common/Button';
import { connectSocket } from '@/services/socket/socketClient';

const LABELS = {
  mention: 'mentioned you',
  reply: 'replied to you',
  direct: 'sent you a message',
  invitation: 'joined your workspace',
  channel: 'added you to a channel',
};
const SHOW_MS = 6000;

/**
 * In-app alert for each new notification. It appears even when the person is already looking at
 * the room, because those notifications are marked read on arrival and would otherwise go unnoticed.
 */
export default function NotificationToast() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const socket = connectSocket();
    const onNew = (notification) => {
      const item = {
        id: notification.id,
        actor: notification.actor?.displayName ?? 'Someone',
        kind: notification.kind,
        preview: notification.preview ?? '',
      };
      setToasts((current) => [...current.slice(-2), item]);
      setTimeout(() => setToasts((current) => current.filter((t) => t.id !== item.id)), SHOW_MS);
    };
    socket.on('notification:new', onNew);
    return () => socket.off('notification:new', onNew);
  }, []);

  const dismiss = (id) => setToasts((current) => current.filter((t) => t.id !== id));

  if (toasts.length === 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed right-4 top-16 z-[70] flex w-80 max-w-[90vw] flex-col gap-2"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm shadow-lg dark:border-slate-700 dark:bg-slate-900"
        >
          <div className="min-w-0 flex-1">
            <p>
              <span className="font-semibold">{t.actor}</span> {LABELS[t.kind] ?? 'sent you a notification'}
            </p>
            <p className="truncate text-slate-500 dark:text-slate-400">{t.preview}</p>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Dismiss notification" onClick={() => dismiss(t.id)}>
            <X size={14} aria-hidden="true" />
          </Button>
        </div>
      ))}
    </div>
  );
}