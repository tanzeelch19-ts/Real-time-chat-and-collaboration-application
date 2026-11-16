import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Users } from 'lucide-react';
import Button from '@/components/common/Button';
import EmptyState from '@/components/common/EmptyState';
import { SkeletonList } from '@/components/common/Skeleton';
import FormAlert from '@/components/forms/FormAlert';
import FormField from '@/components/forms/FormField';
import { useAuth } from '@/features/auth/useAuth';
import { useCreateWorkspace, useWorkspaces } from '@/features/workspaces/useWorkspaces';
import { toSerializableError } from '@/services/api/errors';
import { cn } from '@/utils/cn';

const ROLE_LABELS = { owner: 'Owner', admin: 'Admin', member: 'Member', guest: 'Guest' };

export default function WorkspaceSelectorPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { data: workspaces, isPending, isError, error, refetch } = useWorkspaces();
  const createWorkspace = useCreateWorkspace();
  const [name, setName] = useState('');
  const [formError, setFormError] = useState(null);

  const onCreate = async (event) => {
    event.preventDefault();
    setFormError(null);
    try {
      const workspace = await createWorkspace.mutateAsync(name.trim());
      navigate(`/w/${workspace.id}`);
    } catch (err) {
      setFormError(toSerializableError(err).message);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <header className="mb-8">
        <p className="text-sm text-slate-500 dark:text-slate-400">Signed in as {user?.displayName}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Your workspaces</h1>
      </header>

      {isPending && <SkeletonList rows={3} label="Loading workspaces" />}

      {isError && (
        <FormAlert>
          {toSerializableError(error).message}{' '}
          <button type="button" onClick={() => refetch()} className="font-medium underline">
            Try again
          </button>
        </FormAlert>
      )}

      {workspaces && workspaces.length === 0 && (
        <EmptyState
          icon={Users}
          title="No workspaces yet"
          description="Create a workspace to start chatting with your team, or accept an invitation link."
        />
      )}

      {workspaces && workspaces.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2">
          {workspaces.map((workspace) => (
            <li key={workspace.id}>
              <Link
                to={`/w/${workspace.id}`}
                className={cn(
                  'flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 transition-colors',
                  'hover:border-brand-300 hover:bg-brand-50/40 dark:border-slate-800 dark:bg-slate-900',
                  'dark:hover:border-brand-500/40 dark:hover:bg-brand-500/5',
                )}
              >
                <span
                  aria-hidden="true"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-600 font-semibold text-white"
                >
                  {workspace.name.charAt(0).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{workspace.name}</span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400">
                    {ROLE_LABELS[workspace.myRole] ?? workspace.myRole}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <section
        aria-labelledby="create-workspace-heading"
        className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
      >
        <h2 id="create-workspace-heading" className="text-base font-semibold">
          Create a workspace
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          You will be its owner. A #general channel is created for you.
        </p>

        <form onSubmit={onCreate} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="flex-1">
            <FormField
              id="workspaceName"
              label="Workspace name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Acme Design Team"
              autoComplete="off"
            />
          </div>
          <Button type="submit" className="sm:mt-6" disabled={createWorkspace.isPending || !name.trim()}>
            <Plus size={16} aria-hidden="true" />
            {createWorkspace.isPending ? 'Creating…' : 'Create'}
          </Button>
        </form>

        {formError && <FormAlert className="mt-4">{formError}</FormAlert>}
      </section>

      <div className="mt-8 flex justify-center">
        <button
          type="button"
          onClick={() => logout()}
          className="text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
