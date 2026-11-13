import { useState } from 'react';
import { UserMinus, UserPlus, X } from 'lucide-react';
import Avatar from '@/components/common/Avatar';
import Button from '@/components/common/Button';
import ConfirmationDialog from '@/components/common/ConfirmationDialog';
import { SkeletonList } from '@/components/common/Skeleton';
import FormAlert from '@/components/forms/FormAlert';
import {
  useAddChannelMember,
  useChannelMembers,
  useJoinChannel,
  useRemoveChannelMember,
} from '@/features/channels/useChannels';
import { hasRole } from '@/features/workspaces/permissions';
import { toSerializableError } from '@/services/api/errors';

/**
 * Who is in a channel, with join, add, and remove. Public channels are readable by the whole
 * workspace, so this list shows the people who joined or were added explicitly.
 */
export default function ChannelMembersPanel({ workspaceId, channel, workspaceMembers, myRole, myId, onClose }) {
  const members = useChannelMembers(workspaceId, channel.id);
  const addMember = useAddChannelMember(workspaceId);
  const removeMember = useRemoveChannelMember(workspaceId, channel.id);
  const join = useJoinChannel(workspaceId, channel.id);
  const [addId, setAddId] = useState('');
  const [pendingRemove, setPendingRemove] = useState(null);
  const [error, setError] = useState(null);

  const list = members.data ?? [];
  const joinedIds = new Set(list.map((m) => m.userId));
  const canManage = channel.createdBy === myId || hasRole(myRole, 'admin');
  const canJoin = channel.visibility === 'public' && !joinedIds.has(myId) && myRole !== 'guest';
  const addable = workspaceMembers.filter((m) => !joinedIds.has(m.userId));
  const isSelf = (m) => m.userId === myId;

  const run = async (action) => {
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(toSerializableError(err).message);
    }
  };

  const onAdd = (event) => {
    event.preventDefault();
    if (!addId) return;
    run(async () => {
      await addMember.mutateAsync({ channelId: channel.id, userId: addId });
      setAddId('');
    });
  };

  const confirmRemove = () => {
    const target = pendingRemove;
    run(async () => {
      await removeMember.mutateAsync(target.userId);
      setPendingRemove(null);
    });
  };

  const leaving = Boolean(pendingRemove && isSelf(pendingRemove));

  return (
    <section aria-label="Channel members" className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <h2 className="truncate text-sm font-semibold">Members of #{channel.name}</h2>
        <Button variant="ghost" size="icon" aria-label="Close members" onClick={onClose}>
          <X size={16} aria-hidden="true" />
        </Button>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {channel.visibility === 'public'
            ? 'Everyone in the workspace can read this public channel. This list shows members who joined or were added.'
            : 'Only these members, and admins, can see this private channel.'}
        </p>

        {canJoin && (
          <Button className="w-full" onClick={() => run(() => join.mutateAsync())} disabled={join.isPending}>
            {join.isPending ? 'Joining...' : 'Join channel'}
          </Button>
        )}

        {canManage && addable.length > 0 && (
          <form onSubmit={onAdd} className="flex gap-2">
            <label htmlFor="addChannelMember" className="sr-only">
              Add a member
            </label>
            <select
              id="addChannelMember"
              value={addId}
              onChange={(event) => setAddId(event.target.value)}
              className="h-9 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-950"
            >
              <option value="">Add a member...</option>
              {addable.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.displayName}
                </option>
              ))}
            </select>
            <Button type="submit" variant="secondary" className="h-9 px-3" disabled={!addId || addMember.isPending}>
              <UserPlus size={14} aria-hidden="true" />
              Add
            </Button>
          </form>
        )}

        {error && <FormAlert>{error}</FormAlert>}
        {members.isPending && <SkeletonList rows={3} label="Loading members" />}
        {members.isError && <FormAlert>{toSerializableError(members.error).message}</FormAlert>}

        {members.data && list.length === 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400">No members have joined yet.</p>
        )}

        {list.length > 0 && (
          <ul className="divide-y divide-slate-200 dark:divide-slate-800">
            {list.map((m) => (
              <li key={m.userId} className="flex items-center gap-3 py-2">
                <Avatar name={m.displayName} src={m.avatarUrl} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {m.displayName}
                    {isSelf(m) && <span className="ml-2 text-xs text-slate-500">(you)</span>}
                  </p>
                  <p className="text-xs capitalize text-slate-500 dark:text-slate-400">{m.role}</p>
                </div>
                {(canManage || isSelf(m)) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={isSelf(m) ? 'Leave channel' : `Remove ${m.displayName} from channel`}
                    onClick={() => setPendingRemove(m)}
                  >
                    <UserMinus size={16} aria-hidden="true" />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmationDialog
        open={Boolean(pendingRemove)}
        title={leaving ? 'Leave this channel?' : `Remove ${pendingRemove?.displayName ?? ''} from this channel?`}
        description={
          leaving
            ? 'You will stop appearing in this channel member list. Private channels will hide from you.'
            : 'They will stop appearing in this channel member list.'
        }
        confirmLabel={leaving ? 'Leave' : 'Remove'}
        danger
        busy={removeMember.isPending}
        onConfirm={confirmRemove}
        onCancel={() => setPendingRemove(null)}
      />
    </section>
  );
}