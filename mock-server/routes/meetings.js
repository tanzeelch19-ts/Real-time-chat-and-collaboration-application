import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { db } from '../data/store.js';
import { ApiError } from '../lib/apiError.js';
import { isAdminOrAbove } from '../lib/permissions.js';
import { resolveRoomAccess } from '../lib/rooms.js';
import { getMembership } from '../lib/workspaceService.js';
import { requireAuth } from '../middleware/requireAuth.js';

/**
 * Provider boundary. The mock has no video service, so joinUrl stays null.
 * A real provider (Zoom, Google Meet, or Jitsi) fills in joinUrl later.
 */
export const MEETING_PROVIDER = 'none';

export function toMeetingView(meeting) {
  const creator = db.users.find((u) => u.id === meeting.createdBy);
  return {
    id: meeting.id,
    roomId: meeting.roomId,
    workspaceId: meeting.workspaceId,
    createdBy: { id: meeting.createdBy, displayName: creator?.displayName ?? 'Unknown user' },
    createdAt: meeting.createdAt,
    endedAt: meeting.endedAt,
    provider: MEETING_PROVIDER,
    joinUrl: null,
  };
}

const notFound = () => new ApiError(404, 'NOT_FOUND', 'Meeting not found.');

/** Mounted at /api/rooms. Lists and starts meetings in a room. */
const router = Router();
router.use(requireAuth);

router.get('/:roomId/meetings', (req, res) => {
  if (!resolveRoomAccess(req.params.roomId, req.user.id)) {
    throw new ApiError(404, 'NOT_FOUND', 'Conversation not found.');
  }
  const meetings = db.meetings
    .filter((m) => m.roomId === req.params.roomId && !m.endedAt)
    .map(toMeetingView);
  res.json({ meetings });
});

router.post('/:roomId/meetings', (req, res) => {
  const access = resolveRoomAccess(req.params.roomId, req.user.id);
  if (!access) throw new ApiError(404, 'NOT_FOUND', 'Conversation not found.');

  const meeting = {
    id: randomUUID(),
    roomId: req.params.roomId,
    workspaceId: access.workspaceId,
    createdBy: req.user.id,
    createdAt: new Date().toISOString(),
    endedAt: null,
  };
  db.meetings.push(meeting);
  res.status(201).json({ meeting: toMeetingView(meeting) });
});

/** Mounted at /api/meetings. Anyone who can read the room can open it. */
export const meetingDetailRouter = Router();
meetingDetailRouter.use(requireAuth);

function accessibleMeeting(meetingId, userId) {
  const meeting = db.meetings.find((m) => m.id === meetingId);
  if (!meeting || !resolveRoomAccess(meeting.roomId, userId)) return null;
  return meeting;
}

meetingDetailRouter.get('/:meetingId', (req, res) => {
  const meeting = accessibleMeeting(req.params.meetingId, req.user.id);
  if (!meeting) throw notFound();
  res.json({ meeting: toMeetingView(meeting) });
});

/** Ends the meeting. The creator, an owner, or an admin can end it. */
meetingDetailRouter.post('/:meetingId/end', (req, res) => {
  const meeting = accessibleMeeting(req.params.meetingId, req.user.id);
  if (!meeting) throw notFound();
  const role = getMembership(meeting.workspaceId, req.user.id)?.role;
  if (meeting.createdBy !== req.user.id && !isAdminOrAbove(role)) {
    throw new ApiError(403, 'FORBIDDEN', 'Only the host or an admin can end this meeting.');
  }
  if (!meeting.endedAt) meeting.endedAt = new Date().toISOString();
  res.json({ meeting: toMeetingView(meeting) });
});

export default router;