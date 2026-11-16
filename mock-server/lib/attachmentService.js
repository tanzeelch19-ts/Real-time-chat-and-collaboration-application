import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from '../data/store.js';

export const MAX_FILE_BYTES = 2 * 1024 * 1024;
export const ALLOWED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
];

const UPLOAD_DIR = join(process.env.DATA_DIR || join(dirname(fileURLToPath(import.meta.url)), '..', 'data'), 'uploads');

/** Headers sent by the browser are percent-encoded, so UTF-8 names survive. */
export function decodeHeader(value) {
  if (typeof value !== 'string') return '';
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/** Keeps only the file name, drops path parts and characters that are unsafe in headers and disks. */
export function sanitizeFilename(value) {
  const base = String(value ?? '').split(/[\\/]/).pop() ?? '';
  const unsafe = new Set(['<', '>', ':', '"', '|', '?', '*']);
  const cleaned = [...base].filter((ch) => ch.charCodeAt(0) >= 32 && !unsafe.has(ch)).join('').trim().slice(0, 120);
  return cleaned || 'file';
}

/** Returns { status, code, message, details? } when the upload is not allowed, otherwise null. */
export function validateUpload({ mimeType, size }) {
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return {
      status: 415,
      code: 'UNSUPPORTED_MEDIA_TYPE',
      message: 'This file type is not supported. Use PNG, JPEG, GIF, WebP, PDF, or plain text.',
    };
  }
  if (!size) {
    return {
      status: 422,
      code: 'VALIDATION_ERROR',
      message: 'Please fix the highlighted fields.',
      details: [{ field: 'file', message: 'The file is empty.' }],
    };
  }
  if (size > MAX_FILE_BYTES) {
    return { status: 413, code: 'PAYLOAD_TOO_LARGE', message: 'Files must be 2 MB or smaller.' };
  }
  return null;
}

export function findAttachment(id) {
  return db.attachments.find((a) => a.id === id) ?? null;
}

export function saveAttachment({ roomId, uploaderId, filename, mimeType, buffer }) {
  mkdirSync(UPLOAD_DIR, { recursive: true });
  const id = randomUUID();
  writeFileSync(join(UPLOAD_DIR, id), buffer);
  const record = {
    id,
    roomId,
    messageId: null,
    uploaderId,
    filename,
    mimeType,
    size: buffer.length,
    createdAt: new Date().toISOString(),
  };
  db.attachments.push(record);
  return record;
}

export function linkAttachment(attachmentId, messageId) {
  const record = findAttachment(attachmentId);
  if (record) record.messageId = messageId;
}

/** Deletes the metadata and the file. Used when a message could not be created. */
export function removeAttachment(attachmentId) {
  const index = db.attachments.findIndex((a) => a.id === attachmentId);
  if (index < 0) return;
  db.attachments.splice(index, 1);
  const file = join(UPLOAD_DIR, attachmentId);
  if (existsSync(file)) unlinkSync(file);
}

export function getAttachmentFilePath(record) {
  return join(UPLOAD_DIR, record.id);
}

export function toAttachmentView(record) {
  return {
    id: record.id,
    filename: record.filename,
    mimeType: record.mimeType,
    size: record.size,
    uploaderId: record.uploaderId,
    createdAt: record.createdAt,
    url: `/api/attachments/${record.id}`,
  };
}

export function listAttachmentViews(messageId) {
  return db.attachments.filter((a) => a.messageId === messageId).map(toAttachmentView);
}