import { useCallback, useEffect, useState } from 'react';
import { Download, FileText, RotateCw } from 'lucide-react';
import Button from '@/components/common/Button';
import ImageLightbox from '@/components/common/ImageLightbox';
import { formatBytes } from '@/features/files/fileRules';
import { filesApi } from '@/features/files/filesApi';

/**
 * Shows an attachment. Images load through the API (so the token is sent), open in a
 * lightbox on click, and can be retried after a failure. Other files get a download button.
 */
export default function AttachmentPreview({ attachment }) {
  const isImage = attachment.mimeType.startsWith('image/');
  const [imageUrl, setImageUrl] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!isImage) return undefined;
    let objectUrl = null;
    let cancelled = false;
    filesApi
      .downloadBlob(attachment.url)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setImageUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load this image.');
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [attachment.url, isImage, attempt]);

  const retry = () => {
    setError(null);
    setImageUrl(null);
    setAttempt((value) => value + 1);
  };

  const download = async () => {
    setBusy(true);
    setError(null);
    try {
      const blob = await filesApi.downloadBlob(attachment.url);
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = attachment.filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch {
      setError('Could not download this file.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-2 max-w-sm space-y-1">
      {isImage && !imageUrl && !error && (
        <div className="h-32 w-56 animate-pulse rounded-lg bg-slate-200 motion-reduce:animate-none dark:bg-slate-800" />
      )}

      {isImage && imageUrl && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`Open image ${attachment.filename}`}
          className="block rounded-lg"
        >
          <img
            src={imageUrl}
            alt={attachment.filename}
            className="max-h-72 rounded-lg border border-slate-200 object-contain dark:border-slate-700"
          />
        </button>
      )}

      <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
        <FileText size={18} aria-hidden="true" className="shrink-0 text-slate-400" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{attachment.filename}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{formatBytes(attachment.size)}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Download ${attachment.filename}`}
          onClick={download}
          disabled={busy}
        >
          <Download size={16} aria-hidden="true" />
        </Button>
      </div>

      {error && (
        <div className="flex flex-wrap items-center gap-2">
          <p role="alert" className="text-xs text-red-600 dark:text-red-400">
            {error}
          </p>
          {isImage && (
            <Button variant="secondary" className="h-7 px-2 text-xs" onClick={retry}>
              <RotateCw size={12} aria-hidden="true" />
              Retry
            </Button>
          )}
        </div>
      )}

      {open && imageUrl && <ImageLightbox src={imageUrl} alt={attachment.filename} onClose={close} />}
    </div>
  );
}
