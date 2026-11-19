// @vitest-environment node
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

let dir;

/** DATA_DIR is read when persist.js loads, so each test imports a fresh copy. */
async function freshPersist() {
  vi.resetModules();
  process.env.DATA_DIR = dir;
  return import('./persist.js');
}

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'persist-test-'));
});

describe('persist', () => {
  it('starts with seed data when db.json is empty or truncated', async () => {
    const { loadDb } = await freshPersist();
    writeFileSync(join(dir, 'db.json'), '');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(loadDb()).toBe(false);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('writes db.json through a temp file and leaves no .tmp behind', async () => {
    const { saveDb, loadDb } = await freshPersist();
    saveDb();
    expect(existsSync(join(dir, 'db.json.tmp'))).toBe(false);
    expect(() => JSON.parse(readFileSync(join(dir, 'db.json'), 'utf8'))).not.toThrow();
    expect(loadDb()).toBe(true);
  });
});
