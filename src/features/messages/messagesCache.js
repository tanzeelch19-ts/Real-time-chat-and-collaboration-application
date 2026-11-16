/**
 * Pure helpers for the message cache.
 * Cache shape: { messages: Message[], nextCursor: string | null }, oldest first.
 */
const EMPTY = { messages: [], nextCursor: null };

/** Adds a live message unless it is already in the list. Ignores rooms that are not loaded yet. */
export function mergeIncomingMessage(data, message) {
  if (!data) return data;
  if (data.messages.some((m) => m.id === message.id)) return data;
  return { ...data, messages: [...data.messages, message] };
}

/** Shows a message the user just sent, before the server confirms it. */
export function addPendingMessage(data, pending) {
  const base = data ?? EMPTY;
  return { ...base, messages: [...base.messages, pending] };
}

/** Swaps the pending entry (matched by clientId) for the saved message. */
export function confirmPendingMessage(data, clientId, message) {
  const base = data ?? EMPTY;
  const withoutDuplicate = base.messages.filter((m) => m.id !== message.id);
  const index = withoutDuplicate.findIndex((m) => m.clientId === clientId);
  if (index < 0) return { ...base, messages: [...withoutDuplicate, message] };

  const next = [...withoutDuplicate];
  next[index] = message;
  return { ...base, messages: next };
}

export function markPendingFailed(data, clientId) {
  if (!data) return data;
  return {
    ...data,
    messages: data.messages.map((m) => (m.clientId === clientId ? { ...m, status: 'failed' } : m)),
  };
}

/** Adds an older page to the top, skipping anything already shown. */
export function prependOlder(data, olderPage) {
  if (!data) return data;
  const known = new Set(data.messages.map((m) => m.id));
  const fresh = olderPage.messages.filter((m) => !known.has(m.id));
  return { messages: [...fresh, ...data.messages], nextCursor: olderPage.nextCursor };
}

/** Swaps in the server copy of a message that is already shown (edit, delete, reaction, reply count). */
export function replaceMessage(data, message) {
  if (!data) return data;
  if (!data.messages.some((m) => m.id === message.id)) return data;
  return { ...data, messages: data.messages.map((m) => (m.id === message.id ? message : m)) };
}
