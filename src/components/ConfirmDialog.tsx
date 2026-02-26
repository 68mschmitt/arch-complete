import { useEffect, useRef } from 'react';
import styles from './ConfirmDialog.module.css';

type ConfirmDialogProps = {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
};

function ConfirmDialog({ message, onConfirm, onCancel }: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  return (
    <div className={styles.overlay} data-testid="confirm-dialog-overlay" onClick={onCancel}>
      <div
        className={styles.dialog}
        data-testid="confirm-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <p className={styles.message}>{message}</p>
        <div className={styles.actions}>
          <button
            ref={cancelRef}
            className={styles.cancelButton}
            data-testid="confirm-dialog-cancel"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className={styles.confirmButton}
            data-testid="confirm-dialog-confirm"
            onClick={onConfirm}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
