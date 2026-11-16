import { describe, expect, it } from 'vitest';
import {
  addPendingMessage,
  confirmPendingMessage,
  mergeIncomingMessage,
  prependOlder,
} from '@/features/messages/messagesCache';

const msg = (id, body = id) => ({ id, body, roomId: 'channel:c1', createdAt: '2026-01-01T00:00:00Z' });

describe('message cache helpers', () => {
  it('does not add the same live message twice', () => {
    const data = { messages: [msg('a')], nextCursor: null };
    const once = mergeIncomingMessage(data, msg('b'));
    const twice = mergeIncomingMessage(once, msg('b'));
    expect(twice.messages.map((m) => m.id)).toEqual(['a', 'b']);
  });

  it('replaces a pending message with the saved one', () => {
    const pending = { ...msg('pending-1'), clientId: 'c-1', status: 'sending' };
    const data = addPendingMessage({ messages: [], nextCursor: null }, pending);
    const saved = confirmPendingMessage(data, 'c-1', msg('server-1', 'hi'));
    expect(saved.messages).toHaveLength(1);
    expect(saved.messages[0].id).toBe('server-1');
  });

  it('prepends an older page without duplicates', () => {
    const data = { messages: [msg('c'), msg('d')], nextCursor: 'c' };
    const page = { messages: [msg('a'), msg('b'), msg('c')], nextCursor: null };
    const merged = prependOlder(data, page);
    expect(merged.messages.map((m) => m.id)).toEqual(['a', 'b', 'c', 'd']);
    expect(merged.nextCursor).toBeNull();
  });
});
