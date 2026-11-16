import { describe, expect, it } from 'vitest';
import { isGroupedWithPrevious } from '@/utils/grouping';

const msg = (id, authorId, createdAt, extra = {}) => ({
  id,
  author: { id: authorId },
  createdAt,
  deletedAt: null,
  threadId: null,
  ...extra,
});

describe('isGroupedWithPrevious', () => {
  it('groups a same-author message sent within five minutes', () => {
    const a = msg('1', 'u1', '2026-01-01T10:00:00Z');
    const b = msg('2', 'u1', '2026-01-01T10:02:00Z');
    expect(isGroupedWithPrevious(a, b)).toBe(true);
  });

  it('does not group a different author, a long gap, or a deleted message', () => {
    const a = msg('1', 'u1', '2026-01-01T10:00:00Z');
    expect(isGroupedWithPrevious(a, msg('2', 'u2', '2026-01-01T10:01:00Z'))).toBe(false);
    expect(isGroupedWithPrevious(a, msg('3', 'u1', '2026-01-01T10:30:00Z'))).toBe(false);
    expect(isGroupedWithPrevious(a, msg('4', 'u1', '2026-01-01T10:01:00Z', { deletedAt: 'x' }))).toBe(false);
  });
});
