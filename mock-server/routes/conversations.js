import { Router } from 'express';
import { db } from '../data/store.js';
import { ApiError } from '../lib/apiError.js';
import { membersOf, openConversation, toConversationView } from '../lib/conversationService.js';
import { saveDb } from '../lib/persist.js';
import { assertValid } from '../lib/validate.js';
import { getMembership } from '../lib/workspaceService.js';
import { emitToUser } from '../realtime/hub.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();
router.use(requireAuth);

/** Conversations the caller is part of, newest first. Optional ?workspaceId filter. */
router.get('/', (req, res) => {
  const workspaceId = typeof req.query.workspaceId === 'string' ? req.query.workspaceId : null;
  const conversations = db.conversations
    .filter((c) => membersOf(c.id).includes(req.user.id))
    .filter((c) => !workspaceId || c.workspaceId === workspaceId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((c) => toConversationView(c, req.user.id));
  res.json({ conversations });
});

/**
 * Opens a direct message (one other person) or a group (two or more).
 * Returns 201 when a new conversation is created, 200 when a direct one already exists.
 */
router.post('/', (req, res) => {
  const { workspaceId, userIds, name } = req.body ?? {};
  const others = Array.isArray(userIds)
    ? [...new Set(userIds.filter((id) => typeof id === 'string' && id !== req.user.id))]
    : [];

  assertValid({
    workspaceId: typeof workspaceId === 'string' && workspaceId ? null : 'Workspace is required.',
    userIds: others.length >= 1 && others.length <= 9 ? null : 'Choose between 1 and 9 other people.',
    name:
      name !== undefined && (typeof name !== 'string' || name.trim().length > 60)
        ? 'Group name must be 60 characters or fewer.'
        : null,
  });

  if (!getMembership(workspaceId, req.user.id)) {
    throw new ApiError(404, 'NOT_FOUND', 'Workspace not found.');
  }
  if (others.some((id) => !getMembership(workspaceId, id))) {
    throw new ApiError(422, 'VALIDATION_ERROR', 'Please fix the highlighted fields.', [
      { field: 'userIds', message: 'Everyone must be a member of this workspace.' },
    ]);
  }

  const { conversation, created } = openConversation({
    workspaceId,
    creatorId: req.user.id,
    userIds: others,
    name,
  });
  saveDb();

  if (created) {
    // Each person gets their own view, because a direct message is named after the other person.
    for (const memberId of membersOf(conversation.id)) {
      if (memberId !== req.user.id) {
        emitToUser(memberId, 'conversation:created', toConversationView(conversation, memberId));
      }
    }
  }

  res.status(created ? 201 : 200).json({ conversation: toConversationView(conversation, req.user.id) });
});

export default router;
