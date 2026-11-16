import { afterEach, describe, expect, it } from 'vitest';
import {
  AWAY_AFTER_MS,
  awayUserIds,
  isAway,
  markConnected,
  markDisconnected,
  touchActivity,
} from './presence.js';

describe('presence away state', () => {
  afterEach(() => {
    markDisconnected('p1');
  });

  it('marks a connected user away after the idle limit', () => {
    markConnected('p1');
    const now = Date.now();
    expect(isAway('p1', now)).toBe(false);
    expect(isAway('p1', now + AWAY_AFTER_MS + 1000)).toBe(true);
  });

  it('clears away when the user is active again', () => {
    markConnected('p1');
    const later = Date.now() + AWAY_AFTER_MS + 1000;
    touchActivity('p1', later);
    expect(isAway('p1', later)).toBe(false);
  });

  it('never reports an offline user as away', () => {
    const later = Date.now() + AWAY_AFTER_MS * 2;
    expect(isAway('nobody', later)).toBe(false);
    expect(awayUserIds(later)).not.toContain('nobody');
  });
});
