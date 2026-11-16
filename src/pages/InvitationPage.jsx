import { Link, useNavigate, useParams } from 'react-router-dom';
import Button from '@/components/common/Button';
import { SkeletonList } from '@/components/common/Skeleton';
import FormAlert from '@/components/forms/FormAlert';
import AuthLayout from '@/components/layout/AuthLayout';
import { useAcceptInvitation, useInvitationPreview } from '@/features/workspaces/useWorkspaces';
import { toSerializableError } from '@/services/api/errors';

const ROLE_LABELS = { admin: 'Admin', member: 'Member', guest: 'Guest' };

export default function InvitationPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const preview = useInvitationPreview(token);
  const accept = useAcceptInvitation();

  const footer = (
    <Link to="/workspaces" className="font-medium text-brand-600 hover:underline dark:text-brand-300">
      Go to your workspaces
    </Link>
  );

  if (preview.isPending) {
    return (
      <AuthLayout title="Loading invitation" footer={footer}>
        <SkeletonList rows={2} label="Loading invitation" />
      </AuthLayout>
    );
  }

  if (preview.isError) {
    return (
      <AuthLayout title="Invitation not valid" footer={footer}>
        <FormAlert>{toSerializableError(preview.error).message}</FormAlert>
      </AuthLayout>
    );
  }

  const { workspace, role, alreadyMember } = preview.data;

  const onJoin = async () => {
    try {
      const result = await accept.mutateAsync(token);
      navigate(`/w/${result.workspace.id}`);
    } catch {
      // The error is shown below from accept.error.
    }
  };

  return (
    <AuthLayout
      title={`Join ${workspace.name}`}
      subtitle={`You have been invited as ${ROLE_LABELS[role] ?? role}.`}
      footer={footer}
    >
      {accept.isError && <FormAlert className="mb-4">{toSerializableError(accept.error).message}</FormAlert>}

      {alreadyMember ? (
        <div className="space-y-4 text-center">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            You are already a member of this workspace.
          </p>
          <Button className="w-full" onClick={() => navigate(`/w/${workspace.id}`)}>
            Open workspace
          </Button>
        </div>
      ) : (
        <Button className="w-full" onClick={onJoin} disabled={accept.isPending}>
          {accept.isPending ? 'Joining…' : 'Join workspace'}
        </Button>
      )}
    </AuthLayout>
  );
}
