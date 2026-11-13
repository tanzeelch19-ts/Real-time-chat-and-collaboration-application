/** userId -> number of open socket connections. */
const connections = new Map();
/** userId -> timestamp of the last activity ping. */
const lastActive = new Map();
/** userId -> whether the last broadcast said "away", so only changes are sent. */
const awayState = new Map();

/** A connected user with no activity for this long is shown as away. */
export const AWAY_AFTER_MS = 5 * 60 * 1000;

/** Returns true when this is the user's first open connection. */
export function markConnected(userId) {
  const count = connections.get(userId) ?? 0;
  connections.set(userId, count + 1);
  lastActive.set(userId, Date.now());
  awayState.set(userId, false);
  return count === 0;
}

/** Returns true when this was the user's last open connection. */
export function markDisconnected(userId) {
  const count = connections.get(userId) ?? 0;
  if (count <= 1) {
    connections.delete(userId);
    lastActive.delete(userId);
    awayState.delete(userId);
    return count === 1;
  }
  connections.set(userId, count - 1);
  return false;
}

export function touchActivity(userId, now = Date.now()) {
  if (connections.has(userId)) lastActive.set(userId, now);
}

export function isAway(userId, now = Date.now()) {
  if (!connections.has(userId)) return false;
  return now - (lastActive.get(userId) ?? now) > AWAY_AFTER_MS;
}

export function onlineUserIds() {
  return [...connections.keys()];
}

export function awayUserIds(now = Date.now()) {
  return onlineUserIds().filter((userId) => isAway(userId, now));
}

/**
 * Every 30 seconds, tells everyone about users whose away state has changed.
 * Returns the timer so it can be stopped.
 */
export function startAwaySweep(io) {
  const timer = setInterval(() => {
    const now = Date.now();
    for (const userId of onlineUserIds()) {
      const away = isAway(userId, now);
      if (awayState.get(userId) !== away) {
        awayState.set(userId, away);
        io.emit('presence:update', { userId, online: true, away });
      }
    }
  }, 30000);
  timer.unref?.();
  return timer;
}