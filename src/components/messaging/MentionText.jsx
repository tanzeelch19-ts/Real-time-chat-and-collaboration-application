import { Fragment } from 'react';

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Shows the text with "@Name" highlighted for each known member name.
 * Longer names are tried first, so "@Ayesha Owner" wins over "@Ayesha".
 */
export default function MentionText({ text, names = [] }) {
  const usable = names.filter(Boolean).sort((a, b) => b.length - a.length);
  if (usable.length === 0) return text;

  const pattern = new RegExp(`(@(?:${usable.map(escapeRegExp).join('|')})(?![\\p{L}\\p{N}_]))`, 'giu');
  const parts = text.split(pattern);

  // split() with one capture group puts the matches at odd indexes.
  return parts.map((part, index) =>
    index % 2 === 1 ? (
      <mark
        key={index}
        className="rounded bg-brand-100 px-0.5 font-medium text-brand-700 dark:bg-brand-500/25 dark:text-brand-300"
      >
        {part}
      </mark>
    ) : (
      <Fragment key={index}>{part}</Fragment>
    ),
  );
}
