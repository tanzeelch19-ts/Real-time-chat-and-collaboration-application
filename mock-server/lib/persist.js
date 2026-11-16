import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from '../data/store.js';

/** Dev-only file. Delete it to reset the demo data. Uploaded file contents live in data/uploads. */
const DATA_DIR = process.env.DATA_DIR || join(dirname(fileURLToPath(import.meta.url)), '..', 'data');
const FILE = join(DATA_DIR, 'db.json');

const LIST_KEYS = [
  'users',
  'workspaces',
  'memberships',
  'channels',
  'channelMembers',
  'conversations',
  'conversationMembers',
  'messages',
  'reactions',
  'attachments',
  'notifications',
  'audit',
  'pins',
  'savedMessages',
  'meetings',
  'reads',
  'mutes',
];
const MAP_KEYS = ['sessions', 'resetTokens', 'invitations'];

/** Restores saved mock data. Missing keys (older db.json files) become empty. */
export function loadDb() {
  if (!existsSync(FILE)) return false;
  const saved = JSON.parse(readFileSync(FILE, 'utf8'));
  for (const key of LIST_KEYS) db[key] = saved[key] ?? [];
  for (const key of MAP_KEYS) db[key] = new Map(saved[key] ?? []);
  return true;
}

/** Writes the whole mock store to data/db.json. */
export function saveDb() {
  mkdirSync(dirname(FILE), { recursive: true });
  const snapshot = {};
  for (const key of LIST_KEYS) snapshot[key] = db[key];
  for (const key of MAP_KEYS) snapshot[key] = [...db[key]];
  writeFileSync(FILE, JSON.stringify(snapshot, null, 2));
}
