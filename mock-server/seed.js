import { randomUUID } from 'node:crypto';
import { db } from './data/store.js';
import { hashPassword } from './lib/password.js';
import { addChannelMember, addMembership, createChannel, createWorkspace } from './lib/workspaceService.js';

export const SEED_PASSWORD = 'Password123!';

const SEED_USERS = [
  { email: 'owner@demo.test', displayName: 'Ayesha Owner', statusMessage: 'Setting up the workspace' },
  { email: 'admin@demo.test', displayName: 'Bilal Admin', statusMessage: '' },
  { email: 'member@demo.test', displayName: 'Hira Member', statusMessage: 'Heads down' },
  { email: 'guest@demo.test', displayName: 'Omar Guest', statusMessage: '' },
];

/** Demo history shown on every fresh start, so each role sees messages in #general. */
const SEED_MESSAGES = [
  {
    room: 'general',
    email: 'owner@demo.test',
    body: 'Welcome to Demo Workspace! This is #general, where everyone can read and post.',
  },
  {
    room: 'general',
    email: 'admin@demo.test',
    body: 'Admins can moderate channels and manage invite links from Settings.',
  },
  {
    room: 'general',
    email: 'member@demo.test',
    body: 'Members can create channels, reply in threads, and search messages.',
  },
  {
    room: 'general',
    email: 'guest@demo.test',
    body: 'Hi everyone, I am a guest. I can read and post in the channels I was added to.',
  },
  {
    room: 'general',
    email: 'owner@demo.test',
    body: 'Try it: type @ to mention someone, or open the bell for notifications.',
  },
  { room: 'random', email: 'member@demo.test', body: 'Random is public too. Share anything here.' },
  {
    room: 'random',
    email: 'admin@demo.test',
    body: 'Pins, saved messages, and search filters are in the sidebar and the header.',
  },
];

/** Creates the demo accounts and workspace once per server start. */
export async function seedUsers() {
  if (db.users.length > 0) return;
  const passwordHash = await hashPassword(SEED_PASSWORD);
  for (const seed of SEED_USERS) {
    db.users.push({
      id: randomUUID(),
      email: seed.email,
      displayName: seed.displayName,
      avatarUrl: '',
      statusMessage: seed.statusMessage,
      createdAt: new Date().toISOString(),
      passwordHash,
    });
  }
  seedWorkspace();
}

function seedWorkspace() {
  if (db.workspaces.length > 0) return;

  const idOf = (email) => db.users.find((u) => u.email === email).id;
  const owner = idOf('owner@demo.test');
  const admin = idOf('admin@demo.test');
  const member = idOf('member@demo.test');
  const guest = idOf('guest@demo.test');

  const { workspace, general } = createWorkspace({ name: 'Demo Workspace', creatorId: owner });
  addMembership(workspace.id, admin, 'admin');
  addMembership(workspace.id, member, 'member');
  addMembership(workspace.id, guest, 'guest');

  // Guests only see channels they were added to, so add the guest to #general.
  addChannelMember(general.id, guest);

  const random = createChannel({
    workspaceId: workspace.id,
    name: 'random',
    visibility: 'public',
    creatorId: owner,
  });

  const leadership = createChannel({
    workspaceId: workspace.id,
    name: 'leadership',
    visibility: 'private',
    creatorId: owner,
  });
  addChannelMember(leadership.id, owner);
  addChannelMember(leadership.id, admin);

  seedMessages({ general: general.id, random: random.id });
}

function seedMessages(roomIds) {
  if (db.messages.length > 0) return;
  const idOf = (email) => db.users.find((u) => u.email === email).id;
  const start = Date.now() - SEED_MESSAGES.length * 60 * 1000;
  SEED_MESSAGES.forEach((item, index) => {
    db.messages.push({
      id: randomUUID(),
      roomId: `channel:${roomIds[item.room]}`,
      threadId: null,
      authorId: idOf(item.email),
      body: item.body,
      createdAt: new Date(start + index * 60 * 1000).toISOString(),
      editedAt: null,
      deletedAt: null,
    });
  });
}
