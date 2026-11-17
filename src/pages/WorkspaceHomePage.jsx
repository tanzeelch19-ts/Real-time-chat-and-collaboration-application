import { Navigate, useParams } from 'react-router-dom';
import { Hash } from 'lucide-react';
import EmptyState from '@/components/common/EmptyState';
import FormAlert from '@/components/forms/FormAlert';
import { SkeletonList } from '@/components/common/Skeleton';
import { useChannels } from '@/features/channels/useChannels';
import { useWorkspace } from '@/features/workspaces/useWorkspaces';
import { toSerializableError } from '@/services/api/errors';

/**
 * Workspace home. Opens #general, or the first channel you can see, so the workspace is usable
 * right away. If there are no channels yet, it explains what to do next.
 */
export default function WorkspaceHomePage() {
  const { workspaceId } = useParams();
  const { data: workspace } = useWorkspace(workspaceId);
  const { data: channels, isPending, isError, error } = useChannels(workspaceId);

  if (isError) {
    return (
      <div className="p-6">
        <FormAlert>{toSerializableError(error).message}</FormAlert>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="p-6">
        <SkeletonList rows={3} label="Loading workspace" />
      </div>
    );
  }

  const first = channels?.find((c) => c.name === 'general') ?? channels?.[0];
  if (first) {
    return <Navigate to={`/w/${workspaceId}/channels/${first.id}`} replace />;
  }

  return (
    <EmptyState
      icon={Hash}
      title={workspace?.name ? `Welcome to ${workspace.name}` : 'Welcome'}
      description={
        workspace?.description ||
        'You have no channels yet. Ask an admin to add you to one, or create a channel from the sidebar.'
      }
    />
  );
}
