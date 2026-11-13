/** Mirrors the server's upload rules. The server still enforces them. */
export const MAX_FILE_BYTES = 2 * 1024 * 1024;
export const ALLOWED_FILE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
];
export const FILE_ACCEPT = ALLOWED_FILE_TYPES.join(',');

/** Returns an error message, or null when the file can be uploaded. */
export function validateFileForUpload(file) {
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return 'Use PNG, JPEG, GIF, WebP, PDF, or plain text.';
  }
  if (file.size === 0) return 'This file is empty.';
  if (file.size > MAX_FILE_BYTES) return 'Files must be 2 MB or smaller.';
  return null;
}

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}