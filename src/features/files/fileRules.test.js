import { describe, expect, it } from 'vitest';
import { formatBytes, validateFileForUpload } from '@/features/files/fileRules';

describe('file rules', () => {
  it('accepts a small PDF', () => {
    expect(validateFileForUpload({ type: 'application/pdf', size: 1000 })).toBeNull();
  });

  it('rejects unsupported types', () => {
    expect(validateFileForUpload({ type: 'application/x-msdownload', size: 1000 })).not.toBeNull();
  });

  it('rejects files over 2 MB', () => {
    expect(validateFileForUpload({ type: 'image/png', size: 3 * 1024 * 1024 })).toMatch(/2 MB/);
  });

  it('formats sizes for display', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(2048)).toBe('2.0 KB');
  });
});