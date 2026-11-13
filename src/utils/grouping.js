const GROUP_WINDOW_MS = 5 * 60 * 1000;

/**
 * True when `current` can drop its name and avatar because `previous` is from the same
 * person, in the same thread, a few minutes earlier, and neither message is deleted.
 */
export function isGroupedWithPrevious(previous, current) {
  if (!previous || !current) return false;
  if (previous.deletedAt || current.deletedAt) return false;
  if (previous.author.id !== current.author.id) return false;
  if ((previous.threadId ?? null) !== (current.threadId ?? null)) return false;
  const gap = new Date(current.createdAt) - new Date(previous.createdAt);
  return gap >= 0 && gap <= GROUP_WINDOW_MS;
}