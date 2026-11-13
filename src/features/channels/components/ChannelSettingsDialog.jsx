import { useState } from 'react';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import FormAlert from '@/components/forms/FormAlert';
import { useUpdateChannel } from '@/features/channels/useChannels';
import { toSerializableError } from '@/services/api/errors';

/** Mounted only while open, so its state starts from the channel each time. */
function ChannelSettingsForm({ workspaceId, channel, onClose }) {
  const update = useUpdateChannel(workspaceId);
  const [topic, setTopic] = useState(channel.topic ?? '');
  const [description, setDescription] = useState(channel.description ?? '');
  const [archived, setArchived] = useState(Boolean(channel.archivedAt));
  const [error, setError] = useState(null);

  const onSave = async (event) => {
    event.preventDefault();
    setError(null);
    try {
      await update.mutateAsync({
        channelId: channel.id,
        patch: { topic: topic.trim(), description: description.trim(), archived },
      });
      onClose();
    } catch (err) {
      setError(toSerializableError(err).message);
    }
  };

  const inputClass =
    'w-full rounded-lg border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950';

  return (
    <form onSubmit={onSave} className="space-y-4">
      {error && <FormAlert>{error}</FormAlert>}

      <div className="space-y-1.5">
        <label htmlFor="channelTopic" className="block text-sm font-medium">
          Topic
        </label>
        <input
          id="channelTopic"
          maxLength={120}
          value={topic}
          onChange={(event) => setTopic(event.target.value)}
          className={`h-10 ${inputClass}`}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="channelDescription" className="block text-sm font-medium">
          Description
        </label>
        <textarea
          id="channelDescription"
          rows={3}
          maxLength={500}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className={`py-2 ${inputClass}`}
        />
      </div>

      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          checked={archived}
          onChange={(event) => setArchived(event.target.checked)}
          className="mt-1"
        />
        <span>
          <span className="block font-medium">Archive this channel</span>
          <span className="block text-xs text-slate-500 dark:text-slate-400">
            Members can still read it, but nobody can post. The creator or an admin can change this later.
          </span>
        </span>
      </label>

      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose} disabled={update.isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={update.isPending}>
          {update.isPending ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </form>
  );
}

export default function ChannelSettingsDialog({ open, onClose, workspaceId, channel }) {
  if (!open) return null;
  return (
    <Modal
      open
      title={`Settings for #${channel.name}`}
      description="Topic, description, and archive state."
      onClose={onClose}
    >
      <ChannelSettingsForm workspaceId={workspaceId} channel={channel} onClose={onClose} />
    </Modal>
  );
}