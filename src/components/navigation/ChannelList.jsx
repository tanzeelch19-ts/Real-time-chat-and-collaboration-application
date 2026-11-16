import { NavLink } from 'react-router-dom';
import { Hash, Lock, Plus } from 'lucide-react';
import Button from '@/components/common/Button';
import { SkeletonList } from '@/components/common/Skeleton';
import { useChannels } from '@/features/channels/useChannels';
import { canCreateChannel } from '@/features/workspaces/permissions';
import { toSerializableError } from '@/services/api/errors';
import { cn } from '@/utils/cn';

function ChannelGroup({ title, icon: Icon, channels, workspaceId, onNavigate }) {
  if (channels.length === 0) return null;

  return (
    <div className="space-y-0.5">
      <h3 className="px-3 pb-1 text-xs font-medium text-slate-500 dark:text-slate-400">{title}</h3>
      {channels.map((channel) => (
        <NavLink
          key={channel.id}
          to={`/w/${workspaceId}/channels/${channel.id}`}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors',
              isActive
                ? 'bg-brand-50 font-medium text-brand-700 dark:bg-brand-500/15 dark:text-brand-300'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
            )
          }
        >
          <Icon size={16} aria-hidden="true" className="shrink-0" />
          <span className="min-w-0 truncate">{channel.name}</span>
          {channel.archivedAt && (
            <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">archived</span>
          )}
          {channel.unreadCount > 0 && (
            <span className="ml-auto shrink-0 rounded-full bg-brand-600 px-1.5 text-[11px] font-semibold leading-5 text-white">
              {channel.unreadCount > 99 ? '99+' : channel.unreadCount}
              <span className="sr-only"> unread messages</span>
            </span>
          )}
        </NavLink>
      ))}
    </div>
  );
}

/**
 * Sidebar list of channels the user can see, with unread counts. The server already filters
 * the list, so this component only groups and displays it.
 */
export default function ChannelList({ workspaceId, role, onCreate, onNavigate }) {
  const { data: channels, isPending, isError, error } = useChannels(workspaceId);

  const publicChannels = channels?.filter((c) => c.visibility === 'public') ?? [];
  const privateChannels = channels?.filter((c) => c.visibility === 'private') ?? [];

  return (
    <section aria-labelledby="channels-heading" className="space-y-2">
      <div className="flex items-center justify-between px-3">
        <h2
          id="channels-heading"
          className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
        >
          Channels
        </h2>
        {canCreateChannel(role) && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            aria-label="Create channel"
            onClick={onCreate}
          >
            <Plus size={16} aria-hidden="true" />
          </Button>
        )}
      </div>

      {isPending && <SkeletonList rows={3} label="Loading channels" />}

      {isError && (
        <p className="px-3 text-xs text-red-600 dark:text-red-400" role="alert">
          {toSerializableError(error).message}
        </p>
      )}

      {channels && channels.length === 0 && (
        <p className="px-3 text-sm text-slate-500 dark:text-slate-400">No channels you can see yet.</p>
      )}

      <ChannelGroup
        title="Public"
        icon={Hash}
        channels={publicChannels}
        workspaceId={workspaceId}
        onNavigate={onNavigate}
      />
      <ChannelGroup
        title="Private"
        icon={Lock}
        channels={privateChannels}
        workspaceId={workspaceId}
        onNavigate={onNavigate}
      />
    </section>
  );
}
