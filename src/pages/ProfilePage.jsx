import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { ArrowLeft, Camera } from 'lucide-react';
import Avatar from '@/components/common/Avatar';
import Button from '@/components/common/Button';
import FormAlert from '@/components/forms/FormAlert';
import FormField from '@/components/forms/FormField';
import { authApi } from '@/features/auth/authApi';
import { loadSession } from '@/features/auth/authSlice';
import { profileSchema } from '@/features/auth/schemas';
import { useAuth } from '@/features/auth/useAuth';
import { toSerializableError } from '@/services/api/errors';
import { applyServerErrors } from '@/utils/formErrors';

const AVATAR_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
const AVATAR_MAX_BYTES = 512 * 1024;

const toFormValues = (user) => ({
  displayName: user?.displayName ?? '',
  statusMessage: user?.statusMessage ?? '',
  avatarUrl: user?.avatarUrl ?? '',
});

export default function ProfilePage() {
  const dispatch = useDispatch();
  const { user, updateProfile } = useAuth();
  const [saved, setSaved] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarError, setAvatarError] = useState(null);
  const fileRef = useRef(null);

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

  useEffect(() => {
    reset(toFormValues(user));
  }, [user, reset]);

  const onSubmit = async (values) => {
    setSaved(false);
    // An uploaded photo is already saved on the server. Leave it out so this request stays small.
    const patch = values.avatarUrl.startsWith('data:')
      ? { displayName: values.displayName, statusMessage: values.statusMessage }
      : values;
    const action = await updateProfile(patch);
    if (action.error) {
      applyServerErrors(setError, action.payload);
      return;
    }
    setSaved(true);
  };

  const onAvatarPicked = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setAvatarError(null);
    if (!AVATAR_TYPES.includes(file.type)) {
      setAvatarError('Use a PNG, JPEG, GIF, or WebP image.');
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      setAvatarError('Profile photos must be 512 KB or smaller.');
      return;
    }
    setAvatarBusy(true);
    try {
      await authApi.uploadAvatar(file);
      await dispatch(loadSession());
    } catch (err) {
      setAvatarError(toSerializableError(err).message);
    } finally {
      setAvatarBusy(false);
    }
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
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <Avatar name={user?.displayName} src={user?.avatarUrl} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{user?.displayName}</p>
            <p className="truncate text-sm text-slate-500 dark:text-slate-400">
              {user?.statusMessage || 'No status set'}
            </p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept={AVATAR_TYPES.join(',')}
            className="hidden"
            aria-hidden="true"
            tabIndex={-1}
            onChange={onAvatarPicked}
          />
          <Button
            variant="secondary"
            className="h-8 px-3"
            onClick={() => fileRef.current?.click()}
            disabled={avatarBusy}
          >
            <Camera size={14} aria-hidden="true" />
            {avatarBusy ? 'Uploading...' : 'Upload photo'}
          </Button>
        </div>

        {avatarError && <FormAlert className="mb-4">{avatarError}</FormAlert>}

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
            hint="Or paste an https image link. Use Upload photo to add a picture from your computer."
            error={errors.avatarUrl?.message}
            {...register('avatarUrl')}
          />

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={isSubmitting || !isDirty}>
              {isSubmitting ? 'Saving...' : 'Save changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
