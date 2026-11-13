const CHANNEL_NAME_PATTERN = /^[a-z0-9][a-z0-9-]{1,31}$/;
const MANAGED_ROLES = ['admin', 'member', 'guest'];

export function validateWorkspaceName(value) {
  if (typeof value !== 'string') return 'Workspace name is required.';
  const name = value.trim();
  if (name.length < 2) return 'Workspace name must be at least 2 characters.';
  if (name.length > 60) return 'Workspace name must be 60 characters or fewer.';
  return null;
}

/** Channel names are stored lowercase. Allowed: letters, numbers, and hyphens. */
export function validateChannelName(value) {
  if (typeof value !== 'string') return 'Channel name is required.';
  const name = value.trim().toLowerCase();
  if (!CHANNEL_NAME_PATTERN.test(name)) {
    return 'Use 2 to 32 letters, numbers, or hyphens. Start with a letter or number.';
  }
  return null;
}

export function validateVisibility(value) {
  return ['public', 'private'].includes(value) ? null : 'Visibility must be public or private.';
}

/** Owner is never assigned through an API. Only admin, member, or guest. */
export function validateMemberRole(value) {
  return MANAGED_ROLES.includes(value) ? null : 'Role must be admin, member, or guest.';
}

export function validateInviteRole(value) {
  return MANAGED_ROLES.includes(value) ? null : 'Invite role must be admin, member, or guest.';
}

export function validateUserId(value) {
  return typeof value === 'string' && value.length > 0 ? null : 'User ID is required.';
}