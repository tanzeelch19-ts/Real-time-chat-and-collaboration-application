import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '../data/store.js';
import { deleteMessage, editMessage, sendMessage } from './messageActions.js';
import { resolveRoomAccess } from './rooms.js';

/**
 * Permission matrix for the mock API. Every role is checked against every room type and every
 * message action, so a change to one rule breaks a named test instead of passing silently.
 *
 * Fixture: owner (o), admin (a), member (m), guest (g) in one workspace, with
 *  - #pub:  public, guest is a channel member
 *  - #pub2: public, guest is NOT a channel member
 *  - #priv: private, owner is the only explicit member
 *  - a direct conversation between owner and member
 */
const WS = 'w1';
const PUB = 'pub';
const PUB2 = 'pub2';
const PRIV = 'priv';
const DM = 'dm1';
const DM_ROOM = `conversation:${DM}`;

const msg = (id, roomId, authorId) => ({
  id,
  roomId,
  threadId: null,
  authorId,
  body: `body of ${id}`,
  createdAt: new Date().toISOString(),
  editedAt: null,
  deletedAt: null,
});

function seed() {
  const now = new Date().toISOString();
  const users = ['o', 'a', 'm', 'g'];
  db.users = users.map((id) => ({
    id,
    displayName: id,
    email: `${id}@t.local`,
    avatarUrl: '',
    statusMessage: '',
    passwordHash: 'x',
    createdAt: now,
  }));
  db.workspaces = [{ id: WS, name: 'W', createdBy: 'o', createdAt: now }];
  db.memberships = [
    { workspaceId: WS, userId: 'o', role: 'owner', joinedAt: now },
    { workspaceId: WS, userId: 'a', role: 'admin', joinedAt: now },
    { workspaceId: WS, userId: 'm', role: 'member', joinedAt: now },
    { workspaceId: WS, userId: 'g', role: 'guest', joinedAt: now },
  ];
  const channel = (id, name, visibility) => ({
    id,
    workspaceId: WS,
    name,
    visibility,
    createdBy: 'o',
    createdAt: now,
    archivedAt: null,
    topic: '',
    description: '',
  });
  db.channels = [
    channel(PUB, 'pub', 'public'),
    channel(PUB2, 'pub2', 'public'),
    channel(PRIV, 'priv', 'private'),
  ];
  db.channelMembers = [
    { channelId: PUB, userId: 'g' },
    { channelId: PRIV, userId: 'o' },
  ];
  db.conversations = [{ id: DM, workspaceId: WS, kind: 'direct', name: '', createdBy: 'o', createdAt: now }];
  db.conversationMembers = [
    { conversationId: DM, userId: 'o' },
    { conversationId: DM, userId: 'm' },
  ];
  db.messages = [
    msg('m-pub', `channel:${PUB}`, 'm'),
    msg('o-pub', `channel:${PUB}`, 'o'),
    msg('m-dm', DM_ROOM, 'm'),
  ];
  db.reactions = [];
  db.attachments = [];
  db.notifications = [];
  db.mutes = [];
  db.reads = [];
  db.pins = [];
  db.savedMessages = [];
  db.audit = [];
}

beforeEach(seed);

describe('who can open each room', () => {
  // [room, role, expected]
  const cases = [
    [`channel:${PUB}`, 'owner', true],
    [`channel:${PUB}`, 'admin', true],
    [`channel:${PUB}`, 'member', true],
    [`channel:${PUB}`, 'guest', true],
    [`channel:${PUB2}`, 'owner', true],
    [`channel:${PUB2}`, 'admin', true],
    [`channel:${PUB2}`, 'member', true],
    [`channel:${PUB2}`, 'guest', false],
    [`channel:${PRIV}`, 'owner', true],
    [`channel:${PRIV}`, 'admin', true],
    [`channel:${PRIV}`, 'member', false],
    [`channel:${PRIV}`, 'guest', false],
    [DM_ROOM, 'owner', true],
    [DM_ROOM, 'member', true],
    [DM_ROOM, 'admin', false],
    [DM_ROOM, 'guest', false],
  ];
  const ids = { owner: 'o', admin: 'a', member: 'm', guest: 'g' };

  it.each(cases)('%s as %s -> %s', (room, role, expected) => {
    const access = resolveRoomAccess(room, ids[role]) !== null;
    expect(access).toBe(expected);
  });
});

describe('who can post', () => {
  it('a guest who is not in the channel gets 404 and cannot post', () => {
    const result = sendMessage({ roomId: `channel:${PUB2}`, userId: 'g', body: 'hi' });
    expect(result.ok).toBe(false);
    expect(result.status).toBe(404);
  });

  it('a member cannot post to a private channel they are not in', () => {
    const result = sendMessage({ roomId: `channel:${PRIV}`, userId: 'm', body: 'hi' });
    expect(result.status).toBe(404);
  });

  it('an admin cannot post to a direct message they are not part of', () => {
    const result = sendMessage({ roomId: DM_ROOM, userId: 'a', body: 'hi' });
    expect(result.status).toBe(404);
  });

  it('a guest in a channel they belong to can post', () => {
    const result = sendMessage({ roomId: `channel:${PUB}`, userId: 'g', body: 'hi' });
    expect(result.ok).toBe(true);
  });
});

describe('who can edit a message', () => {
  it('the author can edit their own message', () => {
    const result = editMessage({
      roomId: `channel:${PUB}`,
      userId: 'm',
      messageId: 'm-pub',
      body: 'changed',
    });
    expect(result.ok).toBe(true);
  });

  it('a guest cannot edit a member message', () => {
    const result = editMessage({
      roomId: `channel:${PUB}`,
      userId: 'g',
      messageId: 'm-pub',
      body: 'changed',
    });
    expect(result.status).toBe(403);
  });

  it('an owner cannot edit someone else message, even as moderator', () => {
    const result = editMessage({
      roomId: `channel:${PUB}`,
      userId: 'o',
      messageId: 'm-pub',
      body: 'changed',
    });
    expect(result.status).toBe(403);
  });

  it('a member cannot edit a direct message written by the other person', () => {
    const result = editMessage({ roomId: DM_ROOM, userId: 'o', messageId: 'm-dm', body: 'changed' });
    expect(result.status).toBe(403);
  });
});

describe('who can delete a message', () => {
  it('the author can delete their own message', () => {
    const result = deleteMessage({ roomId: `channel:${PUB}`, userId: 'm', messageId: 'm-pub' });
    expect(result.ok).toBe(true);
  });

  it('an owner can moderate (delete) a channel message written by someone else', () => {
    const result = deleteMessage({ roomId: `channel:${PUB}`, userId: 'o', messageId: 'm-pub' });
    expect(result.ok).toBe(true);
  });

  it('an admin can moderate a channel message written by someone else', () => {
    const result = deleteMessage({ roomId: `channel:${PUB}`, userId: 'a', messageId: 'm-pub' });
    expect(result.ok).toBe(true);
  });

  it('a member cannot delete another member message', () => {
    const result = deleteMessage({ roomId: `channel:${PUB}`, userId: 'm', messageId: 'o-pub' });
    expect(result.status).toBe(403);
  });

  it('a guest cannot delete a message they did not write', () => {
    const result = deleteMessage({ roomId: `channel:${PUB}`, userId: 'g', messageId: 'm-pub' });
    expect(result.status).toBe(403);
  });

  it('the owner cannot delete a direct message written by the other person (DMs are author-only)', () => {
    const result = deleteMessage({ roomId: DM_ROOM, userId: 'o', messageId: 'm-dm' });
    expect(result.status).toBe(403);
  });

  it('an admin who is not part of a direct message gets 404, not the message', () => {
    const result = deleteMessage({ roomId: DM_ROOM, userId: 'a', messageId: 'm-dm' });
    expect(result.status).toBe(404);
  });
});
