import { describe, expect, it } from 'vitest';
import { channelSchema } from '@/features/channels/schemas';

describe('channel schema', () => {
  it('accepts names with letters, numbers, and hyphens', () => {
    expect(channelSchema.safeParse({ name: 'design-team', visibility: 'public' }).success).toBe(true);
  });

  it('rejects spaces and symbols in the name', () => {
    expect(channelSchema.safeParse({ name: 'bad name!', visibility: 'public' }).success).toBe(false);
  });

  it('rejects an unknown visibility value', () => {
    expect(channelSchema.safeParse({ name: 'general', visibility: 'secret' }).success).toBe(false);
  });
});