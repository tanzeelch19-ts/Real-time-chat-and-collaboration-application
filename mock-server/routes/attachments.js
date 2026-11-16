import express, { Router } from 'express';
import { db } from '../data/store.js';
import { ApiError } from '../lib/apiError.js';
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_BYTES,
  decodeHeader,
  findAttachment,
  getAttachmentFilePath,
  linkAttachment,
  removeAttachment,
  sanitizeFilename,
  saveAttachment,
  validateUpload,
} from '../lib/attachmentService.js';
import { sendMessage } from '../lib/messageActions.js';
import { findMessage, toMessageView } from '../lib/messageService.js';
import { resolveRoomAccess } from '../lib/rooms.js';
import { emitToRoom } from '../realtime/hub.js';
import { requireAuth } from '../middleware/requireAuth.js';

/** Raw bytes only. Types outside the allowed list are left unparsed and rejected below. */
const rawFile = express.raw({ type: ALLOWED_MIME_TYPES, limit: MAX_FILE_BYTES });

/** Mounted at /api/rooms. Uploads a file and posts it as a message in the room. */
const uploadRouter = Router();
uploadRouter.use(requireAuth);

uploadRouter.post('/:roomId/attachments', rawFile, (req, res) => {
  const { roomId } = req.params;
  if (!resolveRoomAccess(roomId, req.user.id)) {
    throw new ApiError(404, 'NOT_FOUND', 'Conversation not found.');
  }

  const mimeType = (req.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
  const buffer = Buffer.isBuffer(req.body) ? req.body : null;
  const problem = validateUpload({ mimeType, size: buffer ? buffer.length : 0 });
  if (problem) {
    throw new ApiError(problem.status, problem.code, problem.message, problem.details ?? []);
  }

  const filename = sanitizeFilename(decodeHeader(req.get('x-file-name')));
  const caption = decodeHeader(req.get('x-caption')).trim().slice(0, 500);

  const attachment = saveAttachment({ roomId, uploaderId: req.user.id, filename, mimeType, buffer });
  const result = sendMessage({
    roomId,
    userId: req.user.id,
    body: caption || `Shared a file: ${filename}`,
  });
  if (!result.ok) {
    removeAttachment(attachment.id);
    throw new ApiError(result.status, result.code, result.message, result.details);
  }

  linkAttachment(attachment.id, result.message.id);
  const view = toMessageView(findMessage(roomId, result.message.id));
  emitToRoom(roomId, 'message:new', view);
  return res.status(201).json({ message: view });
});

export default uploadRouter;

/** Mounted at /api/attachments. Sends a file only to people who can read its room. */
export const downloadRouter = Router();
downloadRouter.use(requireAuth);

downloadRouter.get('/:attachmentId', (req, res) => {
  const attachment = findAttachment(req.params.attachmentId);
  const message = attachment ? db.messages.find((m) => m.id === attachment.messageId) : null;
  if (!attachment || !message || message.deletedAt || !resolveRoomAccess(message.roomId, req.user.id)) {
    throw new ApiError(404, 'NOT_FOUND', 'File not found.');
  }

  res.setHeader('Content-Type', attachment.mimeType);
  res.setHeader(
    'Content-Disposition',
    `attachment; filename*=UTF-8''${encodeURIComponent(attachment.filename)}`,
  );
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
  return res.sendFile(getAttachmentFilePath(attachment));
});
