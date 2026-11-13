import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';

/**
 * Asks the user to confirm a destructive action. Escape and Cancel both dismiss it.
 * danger=true styles the confirm button as destructive.
 */
export default function ConfirmationDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal open={open} title={title} description={description} onClose={onCancel}>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} disabled={busy}>
          {busy ? 'Working...' : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}