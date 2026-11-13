import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, UserMinus } from 'lucide-react';
import Button from '@/components/common/Button';
import ConfirmationDialog from '@/components/common/ConfirmationDialog';
import PresenceAvatar from '@/components/common/PresenceAvatar';
import { SkeletonList } from '@/components/common/Skeleton';
import FormAlert from '@/components/forms/FormAlert';
import { useAuth } from '@/features/auth/useAuth';
import { canChangeMemberRole, canRemoveMember } from '@/features/workspaces/permissions';
import {
  useChangeMemberRole,
  useMembers,
  useRemoveMember,
} from '@/features/workspaces/useWorkspaces';
import { toSerializableError } from '@/services/api/errors';

const ROLE_LABELS = { owner: 'Owner', admin: 'Admin', member: 'Member', guest: 'Guest' };
const ROLE_ORDER = { owner: 0, admin: 1, member: 2, guest: 3 };
const ASSIGNABLE_ROLES = ['admin', 'member', 'guest'];

/**
 * Lists workspace members and shows only the controls the caller's role allows.
 * Removing someone, or leaving, asks for confirmation first.
 */
export default function MembersPanel({ workspaceId, role: myRole }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: members, isPending, isError, error } = useMembers(workspaceId);
  const changeRole = useChangeMemberRole(workspaceId);
  const removeMember = useRemoveMember(workspaceId);
  const [actionError, setActionError] = useState(null);
  const [pendingRemove, setPendingRemove] = useState(null);

  const sorted = [...(members ?? [])].sort(
    (a, b) =>
      ROLE_ORDER[a.role] - ROLE_ORDER[b.role] || a.displayName.localeCompare(b.displayName),
  );

  const onRoleChange = async (member, newRole) => {
    setActionError(null);
    try {
      await changeRole.mutateAsync({ userId: member.userId, role: newRole });
    } catch (err) {
      setActionError(toSerializableError(err).message);
    }
  };

  const confirmRemove = async () => {
    const member = pendingRemove;
    if (!member) return;
    const isSelf = member.userId === user?.id;
    setActionError(null);
    try {
      await removeMember.mutateAsync(member.userId);
      setPendingRemove(null);
      if (isSelf) navigate('/workspaces');
    } catch (err) {
      setPendingRemove(null);
      setActionError(toSerializableError(err).message);
    }
  };

  const removeTitle = pendingRemove
    ? pendingRemove.userId === user?.id
      ? 'Leave this workspace?'
      : `Remove ${pendingRemove.displayName}?`
    : '';

  return (
    <section
      aria-labelledby="members-heading"
      className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
    >
      <h2 id="members-heading" className="text-base font-semibold">
        Members
      </h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {members ? `${members.length} in this workspace` : 'Loading members'}
      </p>

      {actionError && <FormAlert className="mt-4">{actionError}</FormAlert>}
      {isPending && <SkeletonList rows={4} label="Loading members" />}
      {isError && <FormAlert className="mt-4">{toSerializableError(error).message}</FormAlert>}

      {members && (
        <ul className="mt-4 divide-y divide-slate-200 dark:divide-slate-800">
          {sorted.map((member) => {
            const isSelf = member.userId === user?.id;
            const roleOptions = isSelf
              ? []
              : ASSIGNABLE_ROLES.filter((r) => canChangeMemberRole(myRole, member.role, r));

            return (
              <li key={member.userId} className="flex flex-wrap items-center gap-3 py-3">
                <PresenceAvatar
                  userId={member.userId}
                  name={member.displayName}
                  src={member.avatarUrl}
                  size="md"
                />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {member.displayName}
                    {isSelf && <span className="ml-2 text-xs text-slate-500">(you)</span>}
                  </p>
                  {member.statusMessage && (
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                      {member.statusMessage}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {roleOptions.length > 0 ? (
                    <select
                      aria-label={`Role for ${member.displayName}`}
                      value={member.role}
                      disabled={changeRole.isPending}
                      onChange={(event) => onRoleChange(member, event.target.value)}
                      className="h-8 rounded-lg border border-slate-300 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                    >
                      {roleOptions.map((r) => (
                        <option key={r} value={r}>
                          {ROLE_LABELS[r]}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {ROLE_LABELS[member.role]}
                    </span>
                  )}

                  {isSelf && member.role !== 'owner' && (
                    <Button variant="secondary" onClick={() => setPendingRemove(member)}>
                      <LogOut size={14} aria-hidden="true" />
                      Leave
                    </Button>
                  )}

                  {!isSelf && canRemoveMember(myRole, member.role) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove ${member.displayName}`}
                      onClick={() => setPendingRemove(member)}
                    >
                      <UserMinus size={16} aria-hidden="true" />
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmationDialog
        open={Boolean(pendingRemove)}
        title={removeTitle}
        description={
          pendingRemove?.userId === user?.id
            ? 'You will lose access to this workspace and its channels.'
            : 'They will lose access to this workspace and its channels.'
        }
        confirmLabel={pendingRemove?.userId === user?.id ? 'Leave' : 'Remove'}
        danger
        busy={removeMember.isPending}
        onConfirm={confirmRemove}
        onCancel={() => setPendingRemove(null)}
      />
    </section>
  );
}