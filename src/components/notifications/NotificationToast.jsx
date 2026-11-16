import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import Button from '@/components/common/Button';
import { notificationsApi } from '@/features/notifications/notificationsApi';
import { connectSocket } from '@/services/socket/socketClient';

const LABELS = {
  mention: 'mentioned you',
  reply: 'replied to you',
  direct: 'sent you a message',
  invitation: 'joined your workspace',
  channel: 'added you to a channel',
};
const SHOW_MS = 6000;
const POLL_MS = 4000;

/**
 * Shows an alert for every new notification. It checks the server every 4 seconds and also
 * listens for the socket event, so the alert appears even if one of the two is missed.
 * Notifications that already existed when the page opened are not shown again.
 */
export default function NotificationToast() {
  const [toasts, setToasts] = useState([]);
  const seen = useRef(null);

  const show = (item) => {
    setToasts((current) => (current.some((t) => t.id === item.id) ? current : [...current.slice(-2), item]));
    setTimeout(() => setToasts((current) => current.filter((t) => t.id !== item.id)), SHOW_MS);
  };

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        const list = await notificationsApi.list();
        if (cancelled) return;
        if (seen.current === null) {
          seen.current = new Set(list.map((n) => n.id));
          return;
        }
        for (const n of list) {
          if (seen.current.has(n.id)) continue;
          seen.current.add(n.id);
          if (!n.readAt) show({ id: n.id, actor: n.actor?.displayName ?? 'Someone', kind: n.kind, preview: n.preview ?? '' });
        }
      } catch {
        // Next tick tries again.
      }
    };

    check();
    const timer = setInterval(check, POLL_MS);

    const socket = connectSocket();
    const onNew = (n) => {
      if (seen.current) seen.current.add(n.id);
      show({ id: n.id, actor: n.actor?.displayName ?? 'Someone', kind: n.kind, preview: n.preview ?? '' });
    };
    socket.on('notification:new', onNew);

    return () => {
      cancelled = true;
      clearInterval(timer);
      socket.off('notification:new', onNew);
    };
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