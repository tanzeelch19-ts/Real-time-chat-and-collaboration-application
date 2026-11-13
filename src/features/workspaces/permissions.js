/**
 * Client-side mirror of the server's role rules. The UI uses these to show or hide
 * controls. The server still enforces every rule, so this is only for display.
 */
const RANK = { guest: 0, member: 1, admin: 2, owner: 3 };

export function hasRole(role, minimum) {
  return RANK[role] >= RANK[minimum];
}

export const canCreateChannel = (role) => hasRole(role, 'member');
export const canManageInvitations = (role) => hasRole(role, 'admin');
export const canChangeRoles = (role) => hasRole(role, 'admin');
export const canRenameWorkspace = (role) => role === 'owner';
export const canDeleteWorkspace = (role) => role === 'owner';

/** Owners can invite anyone. Admins can invite members and guests only. */
export function canInviteRole(actorRole, inviteRole) {
  if (!canManageInvitations(actorRole)) return false;
  if (inviteRole === 'admin') return actorRole === 'owner';
  return true;
}

/** Mirrors PATCH /members/:userId. Self-changes are blocked separately in the UI. */
export function canChangeMemberRole(actorRole, targetRole, newRole) {
  if (targetRole === 'owner' || !canChangeRoles(actorRole)) return false;
  if (newRole === 'admin' && actorRole !== 'owner') return false;
  if (actorRole === 'admin' && targetRole === 'admin') return false;
  return true;
}

/** Mirrors DELETE /members/:userId for someone other than the caller. */
export function canRemoveMember(actorRole, targetRole) {
  if (targetRole === 'owner') return false;
  if (!hasRole(actorRole, 'admin')) return false;
  if (actorRole === 'admin' && targetRole === 'admin') return false;
  return true;
}