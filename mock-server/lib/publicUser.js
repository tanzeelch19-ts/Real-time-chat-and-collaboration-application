/** Strips private fields before a user leaves the server. */
export function toPublicUser(user) {
  const { passwordHash: _omit, ...publicFields } = user;
  return publicFields;
}
