import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Button from '@/components/common/Button';
import FormAlert from '@/components/forms/FormAlert';
import FormField from '@/components/forms/FormField';
import { useUpdateWorkspaceDetails } from '@/features/workspaces/useWorkspaceDetails';
import { toSerializableError } from '@/services/api/errors';

const detailsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(60, 'Name must be 60 characters or fewer'),
  description: z.string().trim().max(500, 'Description must be 500 characters or fewer'),
  avatarUrl: z
    .string()
    .trim()
    .max(500, 'URL must be 500 characters or fewer')
    .refine((value) => {
      if (value === '') return true;
      try {
        const { protocol } = new URL(value);
        return protocol === 'http:' || protocol === 'https:';
      } catch {
        return false;
      }
    }, 'Enter a valid http or https URL'),
});

/**
 * Workspace name, description, and avatar link. Only the owner can edit (the server enforces it too).
 * Everyone else sees the same details as read-only text.
 */
export default function WorkspaceDetailsPanel({ workspace, canEdit }) {
  const update = useUpdateWorkspaceDetails(workspace.id);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    resolver: zodResolver(detailsSchema),
    values: {
      name: workspace.name ?? '',
      description: workspace.description ?? '',
      avatarUrl: workspace.avatarUrl ?? '',
    },
  });

  const onSubmit = async (values) => {
    try {
      await update.mutateAsync(values);
    } catch (err) {
      setError('root', { type: 'server', message: toSerializableError(err).message });
    }
  };

  if (!canEdit) {
    return (
      <section
        aria-labelledby="details-heading"
        className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
      >
        <h2 id="details-heading" className="text-base font-semibold">
          Workspace details
        </h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div>
            <dt className="font-medium">Name</dt>
            <dd>{workspace.name}</dd>
          </div>
          <div>
            <dt className="font-medium">Description</dt>
            <dd className="whitespace-pre-wrap break-words">
              {workspace.description || 'No description yet.'}
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          Only the owner can change these details.
        </p>
      </section>
    );
  }

  const saved = update.isSuccess && !isDirty;

  return (
    <section
      aria-labelledby="details-heading"
      className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
    >
      <h2 id="details-heading" className="text-base font-semibold">
        Workspace details
      </h2>

      <form noValidate onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
        {errors.root && <FormAlert>{errors.root.message}</FormAlert>}
        {saved && <FormAlert tone="success">Workspace details saved.</FormAlert>}

        <FormField
          id="workspaceName"
          label="Name"
          autoComplete="off"
          error={errors.name?.message}
          {...register('name')}
        />

        <div className="space-y-1.5">
          <label htmlFor="workspaceDescription" className="block text-sm font-medium">
            Description
          </label>
          <textarea
            id="workspaceDescription"
            rows={3}
            maxLength={500}
            aria-invalid={errors.description ? 'true' : undefined}
            aria-describedby={errors.description ? 'workspaceDescription-error' : undefined}
            className="w-full rounded-lg border border-slate-300 bg-white p-2 text-sm dark:border-slate-700 dark:bg-slate-950"
            {...register('description')}
          />
          {errors.description && (
            <p
              id="workspaceDescription-error"
              role="alert"
              className="text-xs text-red-600 dark:text-red-400"
            >
              {errors.description.message}
            </p>
          )}
        </div>

        <FormField
          id="workspaceAvatar"
          label="Avatar URL"
          type="url"
          hint="An https image link. Leave empty for the initial letter."
          error={errors.avatarUrl?.message}
          {...register('avatarUrl')}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting || !isDirty}>
            {isSubmitting ? 'Saving...' : 'Save details'}
          </Button>
        </div>
      </form>
    </section>
  );
}
