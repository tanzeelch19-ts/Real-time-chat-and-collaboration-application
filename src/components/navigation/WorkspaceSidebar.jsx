import { useEffect, useState } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import { Bell, Bookmark, Hash, Search, Settings, X } from 'lucide-react';
import Button from '@/components/common/Button';
import ChannelList from '@/components/navigation/ChannelList';
import CreateChannelDialog from '@/components/navigation/CreateChannelDialog';
import DirectMessageList from '@/components/navigation/DirectMessageList';
import WorkspaceSwitcher from '@/components/navigation/WorkspaceSwitcher';
import { useWorkspace } from '@/features/workspaces/useWorkspaces';
import { cn } from '@/utils/cn';

const navItems = [
  { to: '', label: 'Home', icon: Hash, end: true },
  { to: 'search', label: 'Search', icon: Search },
  { to: 'notifications', label: 'Notifications', icon: Bell },
  { to: 'saved', label: 'Saved', icon: Bookmark },
  { to: 'settings', label: 'Settings', icon: Settings },
];

/**
 * Workspace navigation. Fixed drawer on mobile, static column on md and up.
 */
export default function WorkspaceSidebar({ open, onClose }) {
  const { workspaceId } = useParams();
  const base = `/w/${workspaceId}`;
  const { data: workspace } = useWorkspace(workspaceId);
  const role = workspace?.myRole;
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  return (
    <>
      <aside
        aria-label="Workspace navigation"
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform duration-200 dark:border-slate-800 dark:bg-slate-900',
          'md:static md:z-auto md:translate-x-0 md:transition-none',
          open ? 'translate-x-0' : '-translate-x-full max-md:invisible',
        )}
      >
        <div className="flex h-14 items-center gap-2 border-b border-slate-200 px-3 dark:border-slate-800">
          <WorkspaceSwitcher />
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Close navigation"
            onClick={onClose}
          >
            <X size={18} aria-hidden="true" />
          </Button>
        </div>

        <nav aria-label="Primary" className="space-y-1 p-3">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={label}
              to={to ? `${base}/${to}` : base}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
                )
              }
            >
              <Icon size={18} aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="flex-1 space-y-6 overflow-y-auto px-3 pb-4">
          <ChannelList
            workspaceId={workspaceId}
            role={role}
            onCreate={() => setCreateOpen(true)}
            onNavigate={onClose}
          />
          <DirectMessageList workspaceId={workspaceId} onNavigate={onClose} />
        </div>
      </aside>

      <CreateChannelDialog open={createOpen} onClose={() => setCreateOpen(false)} workspaceId={workspaceId} />
    </>
  );
}
