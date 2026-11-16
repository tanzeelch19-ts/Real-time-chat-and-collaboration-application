import { describe, expect, it } from 'vitest';
import { dayLabel, sameLocalDay } from '@/utils/dates';

describe('day labels', () => {
  const now = new Date(2026, 10, 14, 12, 0, 0);

  it('labels today and yesterday', () => {
    expect(dayLabel(new Date(2026, 10, 14, 9, 0).toISOString(), now)).toBe('Today');
    expect(dayLabel(new Date(2026, 10, 13, 9, 0).toISOString(), now)).toBe('Yesterday');
  });

  it('compares local calendar days', () => {
    expect(
      sameLocalDay(new Date(2026, 10, 14, 1).toISOString(), new Date(2026, 10, 14, 23).toISOString()),
    ).toBe(true);
    expect(
      sameLocalDay(new Date(2026, 10, 13, 23).toISOString(), new Date(2026, 10, 14, 1).toISOString()),
    ).toBe(false);
  });
});
