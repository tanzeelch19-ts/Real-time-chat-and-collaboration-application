import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MembersPanel from '@/features/workspaces/components/MembersPanel';
import { useAuth } from '@/features/auth/useAuth';
import { useChangeMemberRole, useMembers, useRemoveMember } from '@/features/workspaces/useWorkspaces';
import { renderWithProviders } from '@/test/renderWithProviders';

vi.mock('@/features/auth/useAuth', () => ({ useAuth: vi.fn() }));
vi.mock('@/features/workspaces/useWorkspaces', () => ({
  useMembers: vi.fn(),
  useChangeMemberRole: vi.fn(),
  useRemoveMember: vi.fn(),
}));

const MEMBERS = [
  { userId: 'owner-1', role: 'owner', displayName: 'Ayesha Owner', avatarUrl: '', statusMessage: '' },
  { userId: 'admin-1', role: 'admin', displayName: 'Bilal Admin', avatarUrl: '', statusMessage: '' },
  { userId: 'me', role: 'member', displayName: 'Hira Member', avatarUrl: '', statusMessage: '' },
  { userId: 'guest-1', role: 'guest', displayName: 'Omar Guest', avatarUrl: '', statusMessage: '' },
];

const idle = { mutateAsync: vi.fn(), isPending: false };

/** The signed-in user is always "me" (role member in the list). Only the caller's role changes. */
function renderAs(myRole) {
  useAuth.mockReturnValue({ user: { id: 'me' } });
  useMembers.mockReturnValue({ data: MEMBERS, isPending: false, isError: false });
  useChangeMemberRole.mockReturnValue(idle);
  useRemoveMember.mockReturnValue(idle);
  return renderWithProviders(<MembersPanel workspaceId="w1" role={myRole} />);
}

describe('members list for each role', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('owner can change roles of admins and guests, and remove them, but not the owner', () => {
    renderAs('owner');
    expect(screen.getByLabelText('Role for Bilal Admin')).toBeInTheDocument();
    expect(screen.getByLabelText('Role for Omar Guest')).toBeInTheDocument();
    expect(screen.queryByLabelText('Role for Ayesha Owner')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove Bilal Admin' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Remove Ayesha Owner' })).not.toBeInTheDocument();
  });

  it('admin can change a guest but not an admin, and cannot remove an admin', () => {
    renderAs('admin');
    expect(screen.getByLabelText('Role for Omar Guest')).toBeInTheDocument();
    expect(screen.queryByLabelText('Role for Bilal Admin')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove Omar Guest' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Remove Bilal Admin' })).not.toBeInTheDocument();
  });

  it('member sees no role or remove controls for other people, but can leave', () => {
    renderAs('member');
    expect(screen.queryByLabelText('Role for Omar Guest')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Remove Omar Guest' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Leave' })).toBeInTheDocument();
  });

  it('guest sees no role or remove controls for other people, and can leave', () => {
    renderAs('guest');
    expect(screen.queryByLabelText('Role for Omar Guest')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Remove Bilal Admin' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Leave' })).toBeInTheDocument();
  });
});