import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { SkeletonList } from '@/components/common/Skeleton';
import FormAlert from '@/components/forms/FormAlert';
import AuditPanel from '@/features/audit/components/AuditPanel';
import WorkspaceDetailsPanel from '@/features/workspaces/components/WorkspaceDetailsPanel';
import InvitationsPanel from '@/features/workspaces/components/InvitationsPanel';
import MembersPanel from '@/features/workspaces/components/MembersPanel';
import { canManageInvitations } from '@/features/workspaces/permissions';
import { useWorkspace } from '@/features/workspaces/useWorkspaces';
import { toSerializableError } from '@/services/api/errors';

const ROLE_LABELS = { owner: 'Owner', admin: 'Admin', member: 'Member', guest: 'Guest' };

export default function WorkspaceSettingsPage() {
  const { workspaceId } = useParams();
  const { data: workspace, isPending, isError, error } = useWorkspace(workspaceId);

  if (isPending) {
    return (
      <div className="p-6">
        <SkeletonList rows={4} label="Loading settings" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6">
        <FormAlert>{toSerializableError(error).message}</FormAlert>
      </div>
    );
  }

  const role = workspace.myRole;
  const isAdmin = canManageInvitations(role);

  return (
    <div className="mx-auto h-full w-full max-w-4xl space-y-8 overflow-y-auto px-4 py-8 sm:px-6">
      <Link
        to={`/w/${workspaceId}`}
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        Back to workspace
      </Link>

      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {workspace.name} · Your role: {ROLE_LABELS[role] ?? role}
        </p>
      </header>

      <WorkspaceDetailsPanel workspace={workspace} canEdit={role === 'owner'} />
      {isAdmin && <InvitationsPanel workspaceId={workspaceId} role={role} />}
      <MembersPanel workspaceId={workspaceId} role={role} />
      {isAdmin && <AuditPanel workspaceId={workspaceId} />}
    </div>
  );
}