import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

/**
 * Full-size image viewer. Closes on Escape, the close button, or a backdrop click.
 * Focus moves to the close button when it opens.
 */
export default function ImageLightbox({ src, alt, onClose }) {
  const closeRef = useRef(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-label={alt || 'Image preview'} className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div aria-hidden="true" className="absolute inset-0 bg-slate-950/80" onClick={onClose} />
      <div className="relative max-h-full max-w-full">
        <button
          ref={closeRef}
          type="button"
          aria-label="Close image preview"
          onClick={onClose}
          className="absolute -right-2 -top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-900 shadow dark:bg-slate-800 dark:text-slate-100"
        >
          <X size={16} aria-hidden="true" />
        </button>
        <img src={src} alt={alt} className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain" />
      </div>
    </div>
  );
}