import { useSelector } from 'react-redux';
import { selectPresenceStatus } from '@/features/presence/presenceSlice';
import { cn } from '@/utils/cn';

const LABELS = { online: 'Online', away: 'Away', offline: 'Offline' };

/**
 * Presence dot. Shape changes with the state as well as colour:
 * filled green (online), amber ring with a light centre (away), and grey hollow ring (offline).
 */
export default function PresenceDot({ userId, className }) {
  const status = useSelector(selectPresenceStatus(userId));
  const label = LABELS[status];

  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={cn(
        'inline-block h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-white dark:ring-slate-900',
        status === 'online' && 'bg-emerald-500',
        status === 'away' && 'border-2 border-amber-500 bg-amber-200',
        status === 'offline' && 'border-2 border-slate-400 bg-transparent',
        className,
      )}
    />
  );
}