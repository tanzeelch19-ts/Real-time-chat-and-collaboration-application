const sameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** True when two timestamps fall on the same local calendar day. */
export function sameLocalDay(a, b) {
  return sameDay(new Date(a), new Date(b));
}

/** "Today", "Yesterday", or a full date for anything older. */
export function dayLabel(iso, now = new Date()) {
  const date = new Date(iso);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay(date, now)) return 'Today';
  if (sameDay(date, yesterday)) return 'Yesterday';
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
