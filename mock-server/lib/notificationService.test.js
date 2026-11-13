import { describe, expect, it } from 'vitest';
import { findMentionedUserIds } from './notificationService.js';

const people = [
  { userId: 'a', displayName: 'Ayesha' },
  { userId: 'b', displayName: 'Ayesha Owner' },
  { userId: 'h', displayName: 'Hira Member' },
];

describe('mention detection', () => {
  it('finds full names and prefers the longer name', () => {
    expect(findMentionedUserIds('@Ayesha Owner please look', people)).toEqual(['b']);
  });

  it('ignores case and needs a word boundary after the name', () => {
    expect(findMentionedUserIds('hey @hira member', people)).toEqual(['h']);
    expect(findMentionedUserIds('@Hira Members', people)).toEqual([]);
  });
});