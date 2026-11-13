import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '../data/store.js';
import { listMessages } from './messageService.js';

const ROOM = 'channel:c1';

describe('message history pagination', () => {
  beforeEach(() => {
    db.users = [];
    db.reactions = [];
    db.attachments = [];
    db.messages = ['m1', 'm2', 'm3', 'm4', 'm5'].map((id, i) => ({
      id,
      roomId: ROOM,
      threadId: null,
      authorId: 'u1',
      body: id,
      createdAt: new Date(Date.UTC(2026, 0, 1, 10, i)).toISOString(),
      editedAt: null,
      deletedAt: null,
    }));
  });

  it('pages backwards with nextCursor until the start of the room', () => {
    const first = listMessages(ROOM, { limit: 2 });
    expect(first.messages.map((m) => m.id)).toEqual(['m4', 'm5']);
    expect(first.nextCursor).toBe('m4');

    const second = listMessages(ROOM, { limit: 2, before: first.nextCursor });
    expect(second.messages.map((m) => m.id)).toEqual(['m2', 'm3']);
    expect(second.nextCursor).toBe('m2');

    const third = listMessages(ROOM, { limit: 2, before: second.nextCursor });
    expect(third.messages.map((m) => m.id)).toEqual(['m1']);
    expect(third.nextCursor).toBeNull();
  });
});