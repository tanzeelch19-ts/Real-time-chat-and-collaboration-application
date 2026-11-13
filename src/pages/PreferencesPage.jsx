import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Button from '@/components/common/Button';
import { SkeletonList } from '@/components/common/Skeleton';
import FormAlert from '@/components/forms/FormAlert';
import { usePreferences, useSavePreferences } from '@/features/preferences/usePreferences';
import { selectDensity, selectFontSize, setDensity, setFontSize } from '@/features/ui/uiSlice';
import { toSerializableError } from '@/services/api/errors';

const NOTIFY_OPTIONS = [
  {
    key: 'mentions',
    label: 'When someone mentions me',
    hint: 'Covers @Full Name. Owners and admins can also use @channel.',
  },
  { key: 'replies', label: 'When someone replies to my message' },
  { key: 'direct', label: 'When someone sends me a direct message' },
];

const selectClass =
  'h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950';

export default function PreferencesPage() {
  const dispatch = useDispatch();
  const density = useSelector(selectDensity);
  const fontSize = useSelector(selectFontSize);
  const { data, isPending, isError, error } = usePreferences();
  const save = useSavePreferences();
  const [draft, setDraft] = useState(null);
  const [status, setStatus] = useState(null);
  const values = draft ?? data;

  const onToggle = (key, checked) => {
    setStatus(null);
    setDraft({ ...values, [key]: checked });
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setStatus(null);
    try {
      await save.mutateAsync(values);
      setDraft(null);
      setStatus({ tone: 'success', text: 'Preferences saved.' });
    } catch (err) {
      setStatus({ tone: 'error', text: toSerializableError(err).message });
    }
  };

  return (
    <div className="mx-auto h-full w-full max-w-2xl space-y-6 overflow-y-auto px-4 py-8 sm:px-6">
      <Link
        to="/workspaces"
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        Back to workspaces
      </Link>

      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Preferences</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Notifications are saved to your account. Appearance is saved on this device.
        </p>
      </header>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-sm font-semibold">Appearance</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="densitySelect" className="block text-sm font-medium">
              Message density
            </label>
            <select
              id="densitySelect"
              value={density}
              onChange={(event) => dispatch(setDensity(event.target.value))}
              className={selectClass}
            >
              <option value="comfortable">Comfortable</option>
              <option value="compact">Compact</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="fontSelect" className="block text-sm font-medium">
              Text size
            </label>
            <select
              id="fontSelect"
              value={fontSize}
              onChange={(event) => dispatch(setFontSize(event.target.value))}
              className={selectClass}
            >
              <option value="normal">Normal</option>
              <option value="large">Large</option>
            </select>
          </div>
        </div>
      </section>

      <h2 className="text-sm font-semibold">Notifications</h2>
      {isPending && <SkeletonList rows={3} label="Loading preferences" />}
      {isError && <FormAlert>{toSerializableError(error).message}</FormAlert>}

      {values && (
        <form
          onSubmit={onSubmit}
          className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
        >
          <fieldset className="space-y-4">
            <legend className="mb-3 text-sm font-semibold">Notify me</legend>
            {NOTIFY_OPTIONS.map((option) => (
              <label key={option.key} className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={Boolean(values[option.key])}
                  onChange={(event) => onToggle(option.key, event.target.checked)}
                />
                <span>
                  <span className="block font-medium">{option.label}</span>
                  {option.hint && (
                    <span className="block text-xs text-slate-500 dark:text-slate-400">{option.hint}</span>
                  )}
                </span>
              </label>
            ))}
          </fieldset>

          {status && (
            <FormAlert tone={status.tone === 'success' ? 'success' : 'error'}>{status.text}</FormAlert>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={save.isPending || !draft}>
              {save.isPending ? 'Saving...' : 'Save preferences'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}