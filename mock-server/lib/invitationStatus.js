/**
 * Status shown to admins. Revoked wins, then expired, then accepted once someone has used the link.
 * Invite links can be used by many people, so "accepted" means "used at least once".
 */
export function invitationStatus(invite, now = Date.now()) {
  if (invite.revokedAt) return 'revoked';
  if (invite.expiresAt < now) return 'expired';
  if ((invite.acceptCount ?? 0) > 0) return 'accepted';
  return 'pending';
}