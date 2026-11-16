import { describe, expect, it } from 'vitest';
import {
  canChangeMemberRole,
  canCreateChannel,
  canInviteRole,
  canManageInvitations,
} from '@/features/workspaces/permissions';

describe('workspace permissions', () => {
  it('stops guests from creating channels', () => {
    expect(canCreateChannel('guest')).toBe(false);
    expect(canCreateChannel('member')).toBe(true);
  });

  it('lets only owners invite admins', () => {
    expect(canInviteRole('admin', 'admin')).toBe(false);
    expect(canInviteRole('owner', 'admin')).toBe(true);
  });

  it('lets admins manage invitations, but not members', () => {
    expect(canManageInvitations('admin')).toBe(true);
    expect(canManageInvitations('member')).toBe(false);
  });

  it('never allows changing the owner, and admins cannot change other admins', () => {
    expect(canChangeMemberRole('owner', 'owner', 'member')).toBe(false);
    expect(canChangeMemberRole('admin', 'admin', 'member')).toBe(false);
    expect(canChangeMemberRole('admin', 'member', 'guest')).toBe(true);
  });
});
