import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { MessageSquare, Users } from 'lucide-react';
import Button from '@/components/common/Button';
import PresenceDot from '@/components/common/PresenceDot';
import { SkeletonList } from '@/components/common/Skeleton';
import { useAuth } from '@/features/auth/useAuth';
import { useConversations, useOpenConversation } from '@/features/conversations/useConversations';
import { useMembers } from '@/features/workspaces/useWorkspaces';
import { toSerializableError } from '@/services/api/errors';
import { cn } from '@/utils/cn';

/** For a direct message, the other person's id. Groups have no single presence dot. */
function otherPersonId(conversation, myId) {
  if (conversation.kind !== 'direct') return null;
  return conversation.members.find((m) => m.userId !== myId)?.userId ?? null;
}

/**
 * Sidebar list of direct and group conversations, plus a picker to start a new one.
 */
export default function DirectMessageList({ workspaceId, onNavigate }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: conversations, isPending, isError, error } = useConversations(workspaceId);
  const { data: members } = useMembers(workspaceId);
  const openConversation = useOpenConversation(workspaceId);
  const [target, setTarget] = useState('');
  const [openError, setOpenError] = useState(null);

  const others = (members ?? []).filter((m) => m.userId !== user?.id);

  const onStart = async (event) => {
    event.preventDefault();
    if (!target) return;
    setOpenError(null);
    try {
      const conversation = await openConversation.mutateAsync({ userIds: [target] });
      setTarget('');
      navigate(`/w/${workspaceId}/dm/${conversation.id}`);
      onNavigate?.();
    } catch (err) {
      setOpenError(toSerializableError(err).message);
    }
  };

  return (
    <section aria-labelledby="dm-heading" className="space-y-2">
      <h2
        id="dm-heading"
        className="px-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
      >
        Direct messages
      </h2>

      {isPending && <SkeletonList rows={2} label="Loading conversations" />}
      {isError && (
        <p role="alert" className="px-3 text-xs text-red-600 dark:text-red-400">
          {toSerializableError(error).message}
        </p>
      )}
      {conversations && conversations.length === 0 && (
        <p className="px-3 text-sm text-slate-500 dark:text-slate-400">No conversations yet.</p>
      )}

      <div className="space-y-0.5">
        {conversations?.map((conversation) => {
          const Icon = conversation.kind === 'group' ? Users : MessageSquare;
          const otherId = otherPersonId(conversation, user?.id);
          return (
            <NavLink
              key={conversation.id}
              to={`/w/${workspaceId}/dm/${conversation.id}`}
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
              <span className="min-w-0 flex-1 truncate">{conversation.name}</span>
              {otherId && <PresenceDot userId={otherId} />}
            </NavLink>
          );
        })}
      </div>

      {others.length > 0 && (
        <form onSubmit={onStart} className="flex items-center gap-2 px-3 pt-2">
          <label htmlFor="dmTarget" className="sr-only">
            Person to message
          </label>
          <select
            id="dmTarget"
            value={target}
            onChange={(event) => setTarget(event.target.value)}
            className="h-8 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-950"
          >
            <option value="">Message someone...</option>
            {others.map((member) => (
              <option key={member.userId} value={member.userId}>
                {member.displayName}
              </option>
            ))}
          </select>
          <Button
            type="submit"
            variant="secondary"
            className="h-8 px-3"
            disabled={!target || openConversation.isPending}
          >
            Go
          </Button>
        </form>
      )}

      {openError && (
        <p role="alert" className="px-3 text-xs text-red-600 dark:text-red-400">
          {openError}
        </p>
      )}
    </section>
  );
}