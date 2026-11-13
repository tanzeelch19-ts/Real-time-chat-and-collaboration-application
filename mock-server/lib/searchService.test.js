import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '../data/store.js';
import { searchMessages } from './searchService.js';

describe('message search filters', () => {
  beforeEach(() => {
    const now = new Date().toISOString();
    db.workspaces = [{ id: 'w1', name: 'Test', createdBy: 'u1', createdAt: now }];
    db.memberships = [
      { workspaceId: 'w1', userId: 'u1', role: 'owner', joinedAt: now },
      { workspaceId: 'w1', userId: 'u2', role: 'member', joinedAt: now },
    ];
    db.channels = [
      { id: 'c1', workspaceId: 'w1', name: 'general', visibility: 'public', createdBy: 'u1', createdAt: now, archivedAt: null },
    ];
    db.channelMembers = [];
    db.conversations = [];
    db.conversationMembers = [];
    db.attachments = [];
    db.reactions = [];
    db.messages = [
      { id: 'm1', roomId: 'channel:c1', threadId: null, authorId: 'u1', body: 'quarterly report draft', createdAt: '2026-06-01T10:00:00.000Z', editedAt: null, deletedAt: null },
      { id: 'm2', roomId: 'channel:c1', threadId: null, authorId: 'u2', body: 'quarterly report final', createdAt: '2026-07-01T10:00:00.000Z', editedAt: null, deletedAt: null },
    ];
  });

  it('filters by sender', () => {
    const results = searchMessages({ workspaceId: 'w1', userId: 'u2', query: 'report', senderId: 'u1' });
    expect(results.map((m) => m.id)).toEqual(['m1']);
  });

  it('filters by a date range', () => {
    const results = searchMessages({
      workspaceId: 'w1',
      userId: 'u2',
      from: '2026-06-15T00:00:00.000Z',
      to: '2026-07-31T23:59:59.999Z',
    });
    expect(results.map((m) => m.id)).toEqual(['m2']);
  });
});