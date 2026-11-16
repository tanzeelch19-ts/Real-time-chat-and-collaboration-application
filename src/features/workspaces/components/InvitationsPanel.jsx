import { useState } from 'react';
import { Check, Copy, Trash2 } from 'lucide-react';
import Button from '@/components/common/Button';
import { SkeletonList } from '@/components/common/Skeleton';
import FormAlert from '@/components/forms/FormAlert';
import { canInviteRole } from '@/features/workspaces/permissions';
import {
  useCreateInvitation,
  useInvitations,
  useRevokeInvitation,
} from '@/features/workspaces/useWorkspaces';
import { toSerializableError } from '@/services/api/errors';

const ROLE_LABELS = { admin: 'Admin', member: 'Member', guest: 'Guest' };
const INVITABLE_ROLES = ['admin', 'member', 'guest'];

const STATUS_LABELS = { pending: 'Active', accepted: 'Used', expired: 'Expired', revoked: 'Revoked' };
const STATUS_STYLES = {
  pending: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
  accepted: 'bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300',
  expired: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
  revoked: 'bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300',
};

/** Full link the user can share. The server returns only the path. */
const inviteUrl = (path) => `${window.location.origin}${path}`;

/**
 * Creates, copies, and revokes invite links, and shows each link's status as text.
 * Only active links can be copied or revoked. Owners and admins see this panel.
 */
export default function InvitationsPanel({ workspaceId, role: myRole }) {
  const { data: invitations, isPending, isError, error } = useInvitations(workspaceId);
  const createInvite = useCreateInvitation(workspaceId);
  const revokeInvite = useRevokeInvitation(workspaceId);
  const [inviteRole, setInviteRole] = useState('member');
  const [actionError, setActionError] = useState(null);
  const [copiedToken, setCopiedToken] = useState(null);

  const roleOptions = INVITABLE_ROLES.filter((r) => canInviteRole(myRole, r));
  const sorted = [...(invitations ?? [])].sort(
    (a, b) => (a.status === 'pending' ? 0 : 1) - (b.status === 'pending' ? 0 : 1),
  );

  const onCreate = async (event) => {
    event.preventDefault();
    setActionError(null);
    try {
      await createInvite.mutateAsync(inviteRole);
    } catch (err) {
      setActionError(toSerializableError(err).message);
    }
  };

  const onCopy = async (token, path) => {
    setActionError(null);
    try {
      await navigator.clipboard.writeText(inviteUrl(path));
      setCopiedToken(token);
      setTimeout(() => setCopiedToken((current) => (current === token ? null : current)), 2000);
    } catch {
      setActionError('Could not copy the link. Select it and copy it manually.');
    }
  };

  const onRevoke = async (token) => {
    setActionError(null);
    try {
      await revokeInvite.mutateAsync(token);
    } catch (err) {
      setActionError(toSerializableError(err).message);
    }
  };

  return (
    <section
      aria-labelledby="invitations-heading"
      className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
    >
      <h2 id="invitations-heading" className="text-base font-semibold">
        Invite people
      </h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Create a link. Anyone who opens it while signed in can join with the role you choose. A link can be
        used by many people and expires after 7 days.
      </p>

      <form onSubmit={onCreate} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="space-y-1.5">
          <label htmlFor="inviteRole" className="block text-sm font-medium">
            Role for new invite
          </label>
          <select
            id="inviteRole"
            value={inviteRole}
            onChange={(event) => setInviteRole(event.target.value)}
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950 sm:w-48"
          >
            {roleOptions.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" disabled={createInvite.isPending}>
          {createInvite.isPending ? 'Creating...' : 'Create invite link'}
        </Button>
      </form>

      {actionError && <FormAlert className="mt-4">{actionError}</FormAlert>}

      <div className="mt-6">
        <h3 className="text-sm font-medium">Invite links</h3>

        {isPending && <SkeletonList rows={2} label="Loading invites" />}
        {isError && <FormAlert className="mt-3">{toSerializableError(error).message}</FormAlert>}

        {invitations && invitations.length === 0 && (
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">No invite links yet.</p>
        )}

        {invitations && invitations.length > 0 && (
          <ul className="mt-2 divide-y divide-slate-200 dark:divide-slate-800">
            {sorted.map((invite) => {
              const active = invite.status === 'pending';
              return (
                <li key={invite.token} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                      {ROLE_LABELS[invite.role] ?? invite.role} invite
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[invite.status] ?? ''}`}
                      >
                        {STATUS_LABELS[invite.status] ?? invite.status}
                      </span>
                    </p>
                    {active && (
                      <p className="truncate font-mono text-xs text-slate-500 dark:text-slate-400">
                        {inviteUrl(invite.path)}
                      </p>
                    )}
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Expires {new Date(invite.expiresAt).toLocaleDateString()}
                    </p>
                  </div>

                  {active && (
                    <div className="flex items-center gap-2">
                      <Button variant="secondary" onClick={() => onCopy(invite.token, invite.path)}>
                        {copiedToken === invite.token ? (
                          <Check size={14} aria-hidden="true" />
                        ) : (
                          <Copy size={14} aria-hidden="true" />
                        )}
                        {copiedToken === invite.token ? 'Copied' : 'Copy link'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Revoke invite"
                        onClick={() => onRevoke(invite.token)}
                        disabled={revokeInvite.isPending}
                      >
                        <Trash2 size={16} aria-hidden="true" />
                      </Button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
