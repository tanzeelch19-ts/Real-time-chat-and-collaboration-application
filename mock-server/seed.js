import { randomUUID } from 'node:crypto';
import { db } from './data/store.js';
import { hashPassword } from './lib/password.js';
import {
  addChannelMember,
  addMembership,
  createChannel,
  createWorkspace,
} from './lib/workspaceService.js';

export const SEED_PASSWORD = 'Password123!';

const SEED_USERS = [
  { email: 'owner@demo.test', displayName: 'Ayesha Owner', statusMessage: 'Setting up the workspace' },
  { email: 'admin@demo.test', displayName: 'Bilal Admin', statusMessage: '' },
  { email: 'member@demo.test', displayName: 'Hira Member', statusMessage: 'Heads down' },
  { email: 'guest@demo.test', displayName: 'Omar Guest', statusMessage: '' },
];

/** Creates the demo accounts and a demo workspace once per server start. */
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

  createChannel({ workspaceId: workspace.id, name: 'random', visibility: 'public', creatorId: owner });

  const leadership = createChannel({
    workspaceId: workspace.id,
    name: 'leadership',
    visibility: 'private',
    creatorId: owner,
  });
  addChannelMember(leadership.id, owner);
  addChannelMember(leadership.id, admin);
}