// @vitest-environment node
import http from 'node:http';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { io as connect } from 'socket.io-client';
import { db } from '../data/store.js';
import { attachRealtime } from './index.js';

// Keep this test away from the real demo data file.
vi.mock('../lib/persist.js', () => ({ saveDb: () => {}, loadDb: () => false }));

const TOKEN_A = 'test-token-a';
const TOKEN_B = 'test-token-b';
const FUTURE = Date.now() + 60 * 60 * 1000;

let server;
let ioServer;
let url;

beforeAll(async () => {
  const now = new Date().toISOString();
  db.users = [
    {
      id: 'ua',
      displayName: 'Ayesha Owner',
      email: 'a@test.local',
      avatarUrl: '',
      statusMessage: '',
      passwordHash: 'x',
      createdAt: now,
    },
    {
      id: 'ub',
      displayName: 'Hira Member',
      email: 'b@test.local',
      avatarUrl: '',
      statusMessage: '',
      passwordHash: 'x',
      createdAt: now,
    },
  ];
  db.sessions = new Map([
    [TOKEN_A, { userId: 'ua', expiresAt: FUTURE }],
    [TOKEN_B, { userId: 'ub', expiresAt: FUTURE }],
  ]);
  db.workspaces = [{ id: 'w1', name: 'Test', createdBy: 'ua', createdAt: now }];
  db.memberships = [
    { workspaceId: 'w1', userId: 'ua', role: 'owner', joinedAt: now },
    { workspaceId: 'w1', userId: 'ub', role: 'member', joinedAt: now },
  ];
  db.channels = [
    {
      id: 'c1',
      workspaceId: 'w1',
      name: 'general',
      visibility: 'public',
      createdBy: 'ua',
      createdAt: now,
      archivedAt: null,
    },
  ];
  db.channelMembers = [];
  db.messages = [];
  db.notifications = [];
  db.reactions = [];

  server = http.createServer();
  ioServer = attachRealtime(server);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  url = `http://127.0.0.1:${server.address().port}`;
});

afterAll(() => {
  ioServer?.close();
  server?.close();
});

function client(token) {
  return connect(url, { path: '/socket.io', transports: ['websocket'], auth: { token }, forceNew: true });
}

const connected = (socket) =>
  new Promise((resolve, reject) => {
    socket.once('connect', resolve);
    socket.once('connect_error', reject);
  });

const nextEvent = (socket, event) => new Promise((resolve) => socket.once(event, resolve));
const ack = (socket, event, ...args) => new Promise((resolve) => socket.emit(event, ...args, resolve));

describe('two browser sessions in one channel', () => {
  it('delivers a message from one session to the other without a refresh', async () => {
    const a = client(TOKEN_A);
    const b = client(TOKEN_B);
    await Promise.all([connected(a), connected(b)]);
    expect((await ack(a, 'room:join', 'channel:c1')).ok).toBe(true);
    expect((await ack(b, 'room:join', 'channel:c1')).ok).toBe(true);

    const received = nextEvent(b, 'message:new');
    const sent = await ack(a, 'message:send', { roomId: 'channel:c1', body: 'hello live', clientId: 'c-1' });
    const message = await received;

    expect(sent.ok).toBe(true);
    expect(message.body).toBe('hello live');
    expect(message.author.displayName).toBe('Ayesha Owner');
    a.close();
    b.close();
  });

  it('refuses to join a room that does not exist', async () => {
    const a = client(TOKEN_A);
    await connected(a);
    const response = await ack(a, 'room:join', 'channel:missing');
    expect(response.ok).toBe(false);
    a.close();
  });
});
