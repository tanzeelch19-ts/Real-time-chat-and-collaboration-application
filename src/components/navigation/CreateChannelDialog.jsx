import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import FormAlert from '@/components/forms/FormAlert';
import FormField from '@/components/forms/FormField';
import { channelSchema } from '@/features/channels/schemas';
import { useCreateChannel } from '@/features/channels/useChannels';
import { toSerializableError } from '@/services/api/errors';
import { cn } from '@/utils/cn';
import { applyServerErrors } from '@/utils/formErrors';

const VISIBILITY_OPTIONS = [
  {
    value: 'public',
    label: 'Public',
    hint: 'Visible to workspace members and admins.',
  },
  {
    value: 'private',
    label: 'Private',
    hint: 'Visible only to you, the people you add, and admins.',
  },
];

export default function CreateChannelDialog({ open, onClose, workspaceId }) {
  const navigate = useNavigate();
  const createChannel = useCreateChannel(workspaceId);
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(channelSchema),
    defaultValues: { name: '', visibility: 'public' },
  });

  const close = () => {
    reset();
    createChannel.reset();
    onClose();
  };

  const onSubmit = async (values) => {
    try {
      const channel = await createChannel.mutateAsync({
        name: values.name.toLowerCase(),
        visibility: values.visibility,
      });
      close();
      navigate(`/w/${workspaceId}/channels/${channel.id}`);
    } catch (error) {
      applyServerErrors(setError, toSerializableError(error));
    }
  };

  return (
    <Modal
      open={open}
      title="Create a channel"
      description="Channels organize conversations by topic."
      onClose={close}
    >
      <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {errors.root && <FormAlert>{errors.root.message}</FormAlert>}

        <FormField
          id="channelName"
          label="Channel name"
          placeholder="design-team"
          autoComplete="off"
          hint="Letters, numbers, and hyphens. 2 to 32 characters."
          error={errors.name?.message}
          {...register('name')}
        />

        <fieldset className="space-y-2">
          <legend className="mb-2 text-sm font-medium">Visibility</legend>
          {VISIBILITY_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3',
                'hover:border-brand-300 dark:border-slate-700 dark:hover:border-brand-500/50',
              )}
            >
              <input type="radio" value={option.value} className="mt-1" {...register('visibility')} />
              <span className="min-w-0">
                <span className="block text-sm font-medium">{option.label}</span>
                <span className="block text-xs text-slate-500 dark:text-slate-400">{option.hint}</span>
              </span>
            </label>
          ))}
          {errors.visibility && (
            <p role="alert" className="text-xs text-red-600 dark:text-red-400">
              {errors.visibility.message}
            </p>
          )}
        </fieldset>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating…' : 'Create channel'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
