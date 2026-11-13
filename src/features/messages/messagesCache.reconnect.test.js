import { describe, expect, it } from 'vitest';
import { mergeIncomingMessage, prependOlder } from '@/features/messages/messagesCache';

const msg = (id) => ({ id, body: id, roomId: 'channel:c1', createdAt: '2026-01-01T00:00:00Z' });
const ids = (data) => data.messages.map((m) => m.id);

describe('reconnect does not duplicate messages', () => {
  it('keeps one copy when the socket replays messages that history already loaded', () => {
    // History loaded the latest page: m2 and m3.
    let data = { messages: [msg('m2'), msg('m3')], nextCursor: 'm2' };

    // The user scrolls up, and the older page arrives, overlapping at m2.
    data = prependOlder(data, { messages: [msg('m1'), msg('m2')], nextCursor: null });
    expect(ids(data)).toEqual(['m1', 'm2', 'm3']);

    // The connection drops and comes back. The server replays m3 and sends a new m4.
    data = mergeIncomingMessage(data, msg('m3'));
    data = mergeIncomingMessage(data, msg('m4'));
    expect(ids(data)).toEqual(['m1', 'm2', 'm3', 'm4']);

    // A second reconnect replays m4 again. Still one copy.
    data = mergeIncomingMessage(data, msg('m4'));
    expect(ids(data)).toEqual(['m1', 'm2', 'm3', 'm4']);
  });
});