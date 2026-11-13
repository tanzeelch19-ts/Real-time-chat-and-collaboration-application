import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { useWorkspaces } from '@/features/workspaces/useWorkspaces';
import { cn } from '@/utils/cn';

/**
 * Dropdown in the sidebar that lists the user's workspaces and switches between them.
 */
export default function WorkspaceSwitcher() {
  const navigate = useNavigate();
  const { workspaceId } = useParams();
  const { data: workspaces = [] } = useWorkspaces();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  const current = workspaces.find((w) => w.id === workspaceId);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const switchTo = (id) => {
    setOpen(false);
    navigate(`/w/${id}`);
  };

  return (
    <div ref={rootRef} className="relative min-w-0 flex-1">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-3 rounded-lg px-1 py-1 text-left hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        <span
          aria-hidden="true"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white"
        >
          {(current?.name ?? 'W').charAt(0).toUpperCase()}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">{current?.name ?? 'Workspace'}</span>
          <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
            {current?.myRole ?? ''}
          </span>
        </span>
        <ChevronsUpDown size={16} aria-hidden="true" className="shrink-0 text-slate-400" />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Your workspaces"
          className="absolute left-0 right-0 top-full z-50 mt-2 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-900"
        >
          {workspaces.map((workspace) => {
            const selected = workspace.id === workspaceId;
            return (
              <button
                key={workspace.id}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => switchTo(workspace.id)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm',
                  selected
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800',
                )}
              >
                <span className="min-w-0 flex-1 truncate">{workspace.name}</span>
                {selected && <Check size={14} aria-hidden="true" />}
              </button>
            );
          })}
          <div className="my-1 border-t border-slate-200 dark:border-slate-700" />
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              navigate('/workspaces');
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Plus size={14} aria-hidden="true" />
            Manage workspaces
          </button>
        </div>
      )}
    </div>
  );
}