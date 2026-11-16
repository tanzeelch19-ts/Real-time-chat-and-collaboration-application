import { describe, expect, it } from 'vitest';
import {
  canChangeMemberRole,
  canCreateChannel,
  canDeleteWorkspace,
  canInviteRole,
  canManageInvitations,
  canRemoveMember,
  canRenameWorkspace,
} from '@/features/workspaces/permissions';

const ROLES = ['owner', 'admin', 'member', 'guest'];

describe('what each role may do', () => {
  it('only owners rename or delete the workspace', () => {
    expect(ROLES.map(canRenameWorkspace)).toEqual([true, false, false, false]);
    expect(ROLES.map(canDeleteWorkspace)).toEqual([true, false, false, false]);
  });

  it('owners and admins manage invitations, members and guests do not', () => {
    expect(ROLES.map(canManageInvitations)).toEqual([true, true, false, false]);
  });

  it('everyone except guests can create channels', () => {
    expect(ROLES.map(canCreateChannel)).toEqual([true, true, true, false]);
  });

  it('only owners can invite admins', () => {
    expect(canInviteRole('owner', 'admin')).toBe(true);
    expect(canInviteRole('admin', 'admin')).toBe(false);
    expect(canInviteRole('admin', 'member')).toBe(true);
    expect(canInviteRole('member', 'member')).toBe(false);
  });

  it('admins remove members and guests, never other admins, and nobody removes the owner', () => {
    expect(canRemoveMember('admin', 'member')).toBe(true);
    expect(canRemoveMember('admin', 'guest')).toBe(true);
    expect(canRemoveMember('admin', 'admin')).toBe(false);
    expect(canRemoveMember('owner', 'admin')).toBe(true);
    expect(canRemoveMember('admin', 'owner')).toBe(false);
    expect(canRemoveMember('member', 'guest')).toBe(false);
  });

  it('admins cannot make admins, owners can, and the owner role is never changed', () => {
    expect(canChangeMemberRole('admin', 'member', 'admin')).toBe(false);
    expect(canChangeMemberRole('owner', 'member', 'admin')).toBe(true);
    expect(canChangeMemberRole('admin', 'member', 'guest')).toBe(true);
    expect(canChangeMemberRole('owner', 'owner', 'member')).toBe(false);
  });
});
