import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Avatar from '@/components/common/Avatar';
import Button from '@/components/common/Button';
import FormAlert from '@/components/forms/FormAlert';
import FormField from '@/components/forms/FormField';
import { profileSchema } from '@/features/auth/schemas';
import { useAuth } from '@/features/auth/useAuth';
import { applyServerErrors } from '@/utils/formErrors';

const toFormValues = (user) => ({
  displayName: user?.displayName ?? '',
  statusMessage: user?.statusMessage ?? '',
  avatarUrl: user?.avatarUrl ?? '',
});

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: toFormValues(user),
  });

  // Keep the form in sync when the stored user changes (after a save, for example).
  useEffect(() => {
    reset(toFormValues(user));
  }, [user, reset]);

  const onSubmit = async (values) => {
    setSaved(false);
    const action = await updateProfile(values);
    if (action.error) {
      applyServerErrors(setError, action.payload);
      return;
    }
    setSaved(true);
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
      <Link
        to="/workspaces"
        className="mb-6 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        Back to workspaces
      </Link>

      <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{user?.email}</p>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-6 flex items-center gap-4">
          <Avatar name={user?.displayName} src={user?.avatarUrl} size="lg" />
          <div className="min-w-0">
            <p className="truncate font-medium">{user?.displayName}</p>
            <p className="truncate text-sm text-slate-500 dark:text-slate-400">
              {user?.statusMessage || 'No status set'}
            </p>
          </div>
        </div>

        <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {errors.root && <FormAlert>{errors.root.message}</FormAlert>}
          {saved && <FormAlert tone="success">Profile saved.</FormAlert>}

          <FormField
            id="displayName"
            label="Display name"
            autoComplete="name"
            error={errors.displayName?.message}
            {...register('displayName')}
          />
          <FormField
            id="statusMessage"
            label="Status message"
            hint="Visible to teammates. Up to 80 characters."
            error={errors.statusMessage?.message}
            {...register('statusMessage')}
          />
          <FormField
            id="avatarUrl"
            label="Avatar URL"
            type="url"
            hint="Image upload arrives in Phase 6. Paste an https image link for now."
            error={errors.avatarUrl?.message}
            {...register('avatarUrl')}
          />

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={isSubmitting || !isDirty}>
              {isSubmitting ? 'Savingâ€¦' : 'Save changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}