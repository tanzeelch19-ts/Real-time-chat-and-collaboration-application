import { Menu } from 'lucide-react';
import { useDispatch } from 'react-redux';
import Button from '@/components/common/Button';
import ThemeToggle from '@/components/common/ThemeToggle';
import NotificationBell from '@/components/notifications/NotificationBell';
import UserMenu from '@/components/navigation/UserMenu';
import { setSidebarOpen } from '@/features/ui/uiSlice';

export default function TopBar() {
  const dispatch = useDispatch();

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 relative z-40 relative z-40 bg-white/80 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        aria-label="Open navigation"
        onClick={() => dispatch(setSidebarOpen(true))}
      >
        <Menu size={18} aria-hidden="true" />
      </Button>
      <h1 className="min-w-0 flex-1 truncate text-sm font-semibold">Workspace</h1>
      <NotificationBell />
      <ThemeToggle />
      <UserMenu />
    </header>
  );
}