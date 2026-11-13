const RANK = { guest: 0, member: 1, admin: 2, owner: 3 };

/** Lowest role allowed to perform each action. Route handlers add finer checks where needed. */
const MIN_ROLE = {
  'workspace:update': 'owner',
  'workspace:delete': 'owner',
  'invitations:manage': 'admin',
  'members:remove': 'admin',
  'members:changeRole': 'admin',
  'channels:create': 'member',
};

export function can(role, action) {
  return RANK[role] >= RANK[MIN_ROLE[action]];
}

export function isAdminOrAbove(role) {
  return RANK[role] >= RANK.admin;
}