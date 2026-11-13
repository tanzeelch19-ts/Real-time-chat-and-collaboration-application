import { REACTION_CHOICES } from '@/features/messages/emoji';

/**
 * Grid of allowed reactions. Every button has a name, so the choice is not made by colour or glyph alone.
 */
export default function EmojiPicker({ onPick, label = 'Choose a reaction' }) {
  return (
    <div
      role="group"
      aria-label={label}
      className="grid grid-cols-6 gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-700 dark:bg-slate-900"
    >
      {REACTION_CHOICES.map(({ emoji, name }) => (
        <button
          key={name}
          type="button"
          aria-label={name}
          title={name}
          onClick={() => onPick(emoji)}
          className="flex h-8 w-8 items-center justify-center rounded-md text-base hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <span aria-hidden="true">{emoji}</span>
        </button>
      ))}
    </div>
  );
}