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
  { userId: 'me', role: 'guest', displayName: 'Omar Guest', avatarUrl: '', statusMessage: '' },
  { userId: 'member-1', role: 'member', displayName: 'Hira Member', avatarUrl: '', statusMessage: '' },
];

const idleMutation = { mutateAsync: vi.fn(), isPending: false };

function setup(myRole) {
  useAuth.mockReturnValue({ user: { id: 'me' } });
  useMembers.mockReturnValue({ data: MEMBERS, isPending: false, isError: false });
  useChangeMemberRole.mockReturnValue(idleMutation);
  useRemoveMember.mockReturnValue(idleMutation);
  return renderWithProviders(<MembersPanel workspaceId="w1" role={myRole} />);
}

describe('MembersPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('gives guests no role or remove controls for other members', () => {
    setup('guest');

    expect(screen.queryByLabelText('Role for Hira Member')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Remove Hira Member' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Leave' })).toBeInTheDocument();
  });

  it('lets admins change and remove members, but never touches the owner', () => {
    setup('admin');

    expect(screen.getByLabelText('Role for Hira Member')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove Hira Member' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Role for Ayesha Owner')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Remove Ayesha Owner' })).not.toBeInTheDocument();
  });
});
