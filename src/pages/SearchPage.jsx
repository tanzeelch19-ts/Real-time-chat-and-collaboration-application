import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import Button from '@/components/common/Button';
import EmptyState from '@/components/common/EmptyState';
import { SkeletonList } from '@/components/common/Skeleton';
import FormAlert from '@/components/forms/FormAlert';
import { searchApi } from '@/features/search/searchApi';
import { useMembers } from '@/features/workspaces/useWorkspaces';
import { toSerializableError } from '@/services/api/errors';

const TIME = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });
const EMPTY_FORM = { query: '', senderId: '', from: '', to: '', hasAttachments: false };

function isSearchable(f) {
  return f.query.length >= 2 || Boolean(f.senderId || f.from || f.to || f.hasAttachments);
}

function pathFor(workspaceId, roomId) {
  const separator = roomId.indexOf(':');
  const kind = roomId.slice(0, separator);
  const id = roomId.slice(separator + 1);
  const base = `/w/${workspaceId}`;
  return kind === 'conversation' ? `${base}/dm/${id}` : `${base}/channels/${id}`;
}

export default function SearchPage() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const { data: members = [] } = useMembers(workspaceId);
  const [form, setForm] = useState(EMPTY_FORM);
  const [filters, setFilters] = useState(null);
  const [formError, setFormError] = useState(null);

  const { data: results, isPending, isFetching, isError, error } = useQuery({
    queryKey: ['search', workspaceId, filters],
    queryFn: () => searchApi.messages(workspaceId, filters),
    enabled: Boolean(filters),
  });

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const onSubmit = (event) => {
    event.preventDefault();
    const next = { ...form, query: form.query.trim() };
    if (!isSearchable(next)) {
      setFormError('Type at least 2 characters, or choose a sender, date, or attachment filter.');
      setFilters(null);
      return;
    }
    setFormError(null);
    setFilters(next);
  };

  const loading = Boolean(filters) && (isPending || isFetching);
  const inputClass =
    'h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950';

  return (
    <div className="mx-auto h-full w-full max-w-3xl space-y-6 overflow-y-auto px-4 py-8 sm:px-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Search</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Find messages in channels and conversations you can see. Filters combine.
        </p>
      </header>

      <form
        onSubmit={onSubmit}
        role="search"
        className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex gap-2">
          <label htmlFor="searchQuery" className="sr-only">
            Search messages
          </label>
          <input
            id="searchQuery"
            value={form.query}
            onChange={(event) => update('query', event.target.value)}
            placeholder="Search messages"
            maxLength={200}
            className={inputClass}
          />
          <Button type="submit">
            <Search size={16} aria-hidden="true" />
            Search
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="searchSender" className="block text-sm font-medium">
              Sent by
            </label>
            <select
              id="searchSender"
              value={form.senderId}
              onChange={(event) => update('senderId', event.target.value)}
              className={inputClass}
            >
              <option value="">Anyone</option>
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.displayName}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.hasAttachments}
                onChange={(event) => update('hasAttachments', event.target.checked)}
              />
              Has an attachment
            </label>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="searchFrom" className="block text-sm font-medium">
              From date
            </label>
            <input
              id="searchFrom"
              type="date"
              value={form.from}
              onChange={(event) => update('from', event.target.value)}
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="searchTo" className="block text-sm font-medium">
              To date
            </label>
            <input
              id="searchTo"
              type="date"
              value={form.to}
              onChange={(event) => update('to', event.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      </form>

      {formError && <FormAlert>{formError}</FormAlert>}
      {isError && <FormAlert>{toSerializableError(error).message}</FormAlert>}
      {loading && <SkeletonList rows={3} label="Searching" />}

      {!filters && (
        <EmptyState icon={Search} title="Search your messages" description="Type a word or choose a filter, then search." />
      )}

      {filters && !loading && results && results.length === 0 && (
        <EmptyState icon={Search} title="No matches" description="Nothing matches these filters." />
      )}

      {results && results.length > 0 && (
        <ul className="space-y-2">
          {results.map((result) => (
            <li key={result.id}>
              <button
                type="button"
                onClick={() => navigate(pathFor(workspaceId, result.roomId) + '?message=' + encodeURIComponent(result.id))}
                className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left transition-colors hover:border-brand-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-brand-500/40"
              >
                <div className="flex flex-wrap items-baseline gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-medium text-slate-700 dark:text-slate-200">{result.roomTitle}</span>
                  <span>{result.author.displayName}</span>
                  <time dateTime={result.createdAt}>{TIME.format(new Date(result.createdAt))}</time>
                </div>
                <p className="mt-1 line-clamp-2 break-words text-sm">{result.body}</p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}