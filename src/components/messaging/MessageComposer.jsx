import { useRef, useState } from 'react';
import { Paperclip, Send } from 'lucide-react';
import Button from '@/components/common/Button';
import { FILE_ACCEPT } from '@/features/files/fileRules';
import { cn } from '@/utils/cn';

/** Finds an "@partial name" right before the cursor. Returns where it starts and what was typed. */
function findMentionQuery(text, cursor) {
  const before = text.slice(0, cursor);
  const match = /(^|\s)@([\p{L}\p{N} ._-]{0,30})$/u.exec(before);
  if (!match) return null;
  return { start: before.length - match[2].length - 1, query: match[2] };
}

/**
 * Message input. Enter sends, Shift+Enter adds a line. Typing "@" opens a list of
 * workspace members. The attach button sends a file, and the typed text becomes its caption.
 */
export default function MessageComposer({
  value,
  onChange,
  onSubmit,
  disabled,
  placeholder,
  members = [],
  onAttach,
  uploading = false,
  uploadProgress = null,
}) {
  const [cursor, setCursor] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const textareaRef = useRef(null);
  const fileRef = useRef(null);

  const mention = findMentionQuery(value, cursor);
  const suggestions =
    mention && !dismissed
      ? members
          .filter((m) => m.displayName.toLowerCase().includes(mention.query.trim().toLowerCase()))
          .slice(0, 6)
      : [];
  const open = suggestions.length > 0;
  const current = Math.min(activeIndex, Math.max(suggestions.length - 1, 0));

  const pick = (member) => {
    const insert = `@${member.displayName} `;
    const next = value.slice(0, mention.start) + insert + value.slice(cursor);
    const position = mention.start + insert.length;
    onChange(next);
    setCursor(position);
    setActiveIndex(0);
    requestAnimationFrame(() => {
      textareaRef.current?.setSelectionRange(position, position);
      textareaRef.current?.focus();
    });
  };

  const onKeyDown = (event) => {
    if (open) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActiveIndex((index) => (index + 1) % suggestions.length);
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActiveIndex((index) => (index - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault();
        pick(suggestions[current]);
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        setDismissed(true);
        return;
      }
    }
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      onSubmit(event);
    }
  };

  const onFilePicked = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) onAttach?.(file);
  };

  return (
    <form
      onSubmit={onSubmit}
      className="relative shrink-0 border-t border-slate-200 px-4 py-3 dark:border-slate-800 sm:px-6"
    >
      {open && (
        <ul
          role="listbox"
          aria-label="Mention someone"
          className="absolute bottom-full left-4 right-4 z-20 mb-2 max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lg sm:left-6 sm:right-6 dark:border-slate-700 dark:bg-slate-900"
        >
          {suggestions.map((member, index) => (
            <li key={member.userId} role="option" aria-selected={index === current}>
              <button
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  pick(member);
                }}
                className={cn(
                  'flex w-full items-center rounded-lg px-3 py-2 text-left text-sm',
                  index === current
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800',
                )}
              >
                {member.displayName}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-end gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 focus-within:border-brand-500 dark:border-slate-700 dark:bg-slate-950">
        {onAttach && (
          <>
            <input
              ref={fileRef}
              type="file"
              accept={FILE_ACCEPT}
              tabIndex={-1}
              aria-hidden="true"
              className="hidden"
              onChange={onFilePicked}
            />
            <Button
              variant="ghost"
              size="icon"
              aria-label="Attach file"
              disabled={disabled || uploading}
              onClick={() => fileRef.current?.click()}
            >
              <Paperclip size={16} aria-hidden="true" />
            </Button>
          </>
        )}
        <textarea
          ref={textareaRef}
          aria-label="Message"
          rows={1}
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            setCursor(event.target.selectionStart);
            setDismissed(false);
            setActiveIndex(0);
          }}
          onSelect={(event) => setCursor(event.currentTarget.selectionStart)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          maxLength={4000}
          disabled={disabled}
          className="max-h-40 min-h-6 flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-slate-400 disabled:opacity-50"
        />
        <Button
          type="submit"
          size="icon"
          aria-label="Send message"
          disabled={disabled || uploading || !value.trim()}
        >
          <Send size={16} aria-hidden="true" />
        </Button>
      </div>
      {uploading && (
        <div className="mt-2" role="status" aria-live="polite">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Uploading{uploadProgress !== null ? ' ' + uploadProgress + '%' : '...'}
          </p>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <div
              className="h-full bg-brand-600 transition-all"
              style={{ width: (uploadProgress ?? 0) + '%' }}
            />
          </div>
        </div>
      )}
    </form>
  );
}
