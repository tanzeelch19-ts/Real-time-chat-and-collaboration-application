import { describe, expect, it } from 'vitest';
import { parseRoomId } from './rooms.js';

describe('parseRoomId', () => {
  it('reads channel and conversation room ids', () => {
    expect(parseRoomId('channel:abc')).toEqual({ kind: 'channel', id: 'abc' });
    expect(parseRoomId('conversation:xyz')).toEqual({ kind: 'conversation', id: 'xyz' });
  });

  it('rejects unknown kinds, empty ids, and non-strings', () => {
    expect(parseRoomId('workspace:1')).toBeNull();
    expect(parseRoomId('channel:')).toBeNull();
    expect(parseRoomId(42)).toBeNull();
  });
});