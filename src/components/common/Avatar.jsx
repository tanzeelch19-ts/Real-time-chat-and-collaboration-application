import { useState } from 'react';
import { cn } from '@/utils/cn';

const SIZES = {
  sm: 'h-7 w-7 text-xs',
  md: 'h-9 w-9 text-sm',
  lg: 'h-16 w-16 text-lg',
};

function getInitials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return parts
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

/**
 * User avatar. Shows the image when it loads, otherwise falls back to initials.
 */
export default function Avatar({ name = '', src = '', size = 'md', className }) {
  const [imageFailed, setImageFailed] = useState(false);
  const base = cn(
    'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 font-semibold text-brand-700 dark:bg-brand-500/20 dark:text-brand-300',
    SIZES[size],
    className,
  );

  if (src && !imageFailed) {
    return (
      <img
        src={src}
        alt={name ? `${name} avatar` : 'User avatar'}
        onError={() => setImageFailed(true)}
        className={cn(base, 'object-cover')}
      />
    );
  }

  return (
    <span aria-hidden="true" className={base}>
      {getInitials(name)}
    </span>
  );
}
