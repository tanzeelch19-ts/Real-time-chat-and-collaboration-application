import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
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
  let saved;
  try {
    saved = JSON.parse(readFileSync(FILE, 'utf8'));
  } catch (err) {
    // A half-written or empty file must not stop the server from starting. It starts with seed data.
    console.warn(`Ignoring unreadable ${FILE}: ${err.message}`);
    return false;
  }
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
  // Write to a temp file first, then rename, so a crash mid-write cannot leave a truncated db.json.
  const tmp = `${FILE}.tmp`;
  writeFileSync(tmp, JSON.stringify(snapshot, null, 2));
  renameSync(tmp, FILE);
}
