import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Bell, BellOff, Settings, Users } from 'lucide-react';
import Button from '@/components/common/Button';
import { useAuth } from '@/features/auth/useAuth';
import ChannelMembersPanel from '@/features/channels/components/ChannelMembersPanel';
import ChannelSettingsDialog from '@/features/channels/components/ChannelSettingsDialog';
import { useChannels, useSetMuted } from '@/features/channels/useChannels';
import RoomView from '@/features/messages/components/RoomView';
import { hasRole } from '@/features/workspaces/permissions';
import { useMembers, useWorkspace } from '@/features/workspaces/useWorkspaces';

export default function ChannelPage() {
  const { workspaceId, channelId } = useParams();
  const { user } = useAuth();
  const { data: channels } = useChannels(workspaceId);
  const { data: workspace } = useWorkspace(workspaceId);
  const { data: workspaceMembers = [] } = useMembers(workspaceId);
  const setMuted = useSetMuted(workspaceId);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);

  const roomId = `channel:${channelId}`;
  const channel = channels?.find((c) => c.id === channelId);
  const myRole = workspace?.myRole;
  const canModerate = hasRole(myRole, 'admin');
  const canEdit = Boolean(channel) && (channel.createdBy === user?.id || canModerate);
  const archived = Boolean(channel?.archivedAt);
  const muted = Boolean(channel?.muted);

  let subtitle = channel?.visibility === 'private' ? 'Private channel' : 'Public channel';
  if (channel?.topic) subtitle = `${subtitle} · ${channel.topic}`;
  if (archived) subtitle = 'Archived. Read-only.';

  return (
    <div className="relative flex h-full min-h-0 w-full">
      <RoomView
        key={channelId}
        roomId={roomId}
        title={channel ? `#${channel.name}` : 'Channel'}
        subtitle={subtitle}
        canModerate={canModerate}
        readOnly={archived}
        headerActions={
          <>
            <Button
              variant="secondary"
              className="h-8 px-3"
              aria-pressed={membersOpen}
              onClick={() => setMembersOpen((value) => !value)}
            >
              <Users size={14} aria-hidden="true" />
              Members
            </Button>
            <Button
              variant="secondary"
              className="h-8 px-3"
              aria-pressed={muted}
              disabled={!channel || setMuted.isPending}
              onClick={() => setMuted.mutate({ roomId, muted: !muted })}
            >
              {muted ? <BellOff size={14} aria-hidden="true" /> : <Bell size={14} aria-hidden="true" />}
              {muted ? 'Muted' : 'Mute'}
            </Button>
            {canEdit && (
              <Button variant="secondary" className="h-8 px-3" onClick={() => setSettingsOpen(true)}>
                <Settings size={14} aria-hidden="true" />
                Channel settings
              </Button>
            )}
          </>
        }
      />

      {membersOpen && channel && (
        <div className="absolute inset-y-0 right-0 z-30 w-full max-w-sm border-l border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <ChannelMembersPanel
            workspaceId={workspaceId}
            channel={channel}
            workspaceMembers={workspaceMembers}
            myRole={myRole}
            myId={user?.id}
            onClose={() => setMembersOpen(false)}
          />
        </div>
      )}

      {canEdit && channel && (
        <ChannelSettingsDialog
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          workspaceId={workspaceId}
          channel={channel}
        />
      )}
    </div>
  );
}
