import { LogOut, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import Avatar from '@/components/common/Avatar';
import Button from '@/components/common/Button';
import { useAuth } from '@/features/auth/useAuth';

export default function UserMenu() {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <div className="flex items-center gap-1">
      <Link
        to="/preferences"
        aria-label="Notification preferences"
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <Settings size={18} aria-hidden="true" />
      </Link>
      <Link
        to="/profile"
        aria-label={`Your profile, signed in as ${user.displayName}`}
        className="rounded-full p-0.5 transition-opacity hover:opacity-80"
      >
        <Avatar name={user.displayName} src={user.avatarUrl} size="sm" />
      </Link>
      <Button variant="ghost" size="icon" aria-label="Log out" onClick={() => logout()}>
        <LogOut size={18} aria-hidden="true" />
      </Button>
    </div>
  );
}
