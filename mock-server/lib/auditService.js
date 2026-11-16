import { randomUUID } from 'node:crypto';
import { db } from '../data/store.js';

/** Records an admin-visible action. Never store message bodies or passwords here. */
export function recordAudit({ workspaceId, actorId, action, targetType, targetId, summary }) {
  db.audit.push({
    id: randomUUID(),
    workspaceId,
    actorId,
    action,
    targetType,
    targetId,
    summary,
    createdAt: new Date().toISOString(),
  });
}

export function listAudit(workspaceId, limit = 100) {
  return db.audit
    .filter((entry) => entry.workspaceId === workspaceId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit)
    .map((entry) => {
      const actor = db.users.find((u) => u.id === entry.actorId);
      return {
        id: entry.id,
        action: entry.action,
        targetType: entry.targetType,
        targetId: entry.targetId,
        summary: entry.summary,
        createdAt: entry.createdAt,
        actor: { id: entry.actorId, displayName: actor?.displayName ?? 'Unknown user' },
      };
    });
}
