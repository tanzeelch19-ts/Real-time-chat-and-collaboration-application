import { Fragment } from 'react';
import MentionText from '@/components/messaging/MentionText';

/** Splits **bold**, `code`, and http(s) links. Plain text still gets @mention highlighting. */
const TOKEN = /(\*\*[^*\n]+\*\*|`[^`\n]+`|https?:\/\/[^\s<]+)/;

export default function RichText({ text, names = [] }) {
  const parts = text.split(TOKEN);
  return parts.map((part, index) => {
    if (!part) return null;
    if (index % 2 === 0) {
      return (
        <Fragment key={index}>
          <MentionText text={part} names={names} />
        </Fragment>
      );
    }
    if (part.startsWith('**')) {
      return (
        <strong key={index} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`')) {
      return (
        <code key={index} className="rounded bg-slate-100 px-1 font-mono text-[0.85em] dark:bg-slate-800">
          {part.slice(1, -1)}
        </code>
      );
    }
    return (
      <a
        key={index}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="break-all text-brand-600 underline dark:text-brand-300"
      >
        {part}
      </a>
    );
  });
}