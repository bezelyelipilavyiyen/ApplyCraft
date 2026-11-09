import { useEffect, useRef } from 'react';
import { Icon } from './Icons';

export interface ConfirmDialogProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDialog({ open, onCancel, onConfirm }: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    cancelRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCancel();
        return;
      }
      if (event.key !== 'Tab') return;

      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="wipe-dialog-title"
        aria-describedby="wipe-dialog-description"
        className="fade-in w-full max-w-md rounded-2xl border border-line bg-panel p-6 shadow-[0_30px_90px_-20px_rgba(0,0,0,.95)]"
      >
        <div className="flex items-start justify-between gap-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-danger/25 bg-danger/[.08] text-danger">
            <Icon name="trash" className="h-5 w-5" />
          </span>
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-ghost h-8 w-8 rounded-lg p-0"
            aria-label="Dialog schließen"
          >
            <Icon name="x" className="h-4 w-4" />
          </button>
        </div>

        <h2 id="wipe-dialog-title" className="mt-4 text-lg font-semibold tracking-tight text-ink">
          Alle Daten jetzt löschen?
        </h2>
        <p id="wipe-dialog-description" className="mt-2 text-sm leading-relaxed text-muted">
          Entfernt alle Eingaben, den ausgelesenen Lebenslauf, generierte Dokumente und die
          KI-Verbindung aus dem Arbeitsspeicher. Das lässt sich nicht rückgängig machen.
        </p>
        <p className="mt-3 rounded-xl border border-line bg-white/[.02] p-3 text-[11.5px] leading-relaxed text-faint">
          Bereits an einen KI-Anbieter übertragene Daten bleiben dort gemäß dessen
          Datenschutzbestimmungen bestehen.
        </p>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="btn btn-secondary"
          >
            Abbrechen
          </button>
          <button type="button" onClick={onConfirm} className="btn btn-danger">
            <Icon name="trash" className="h-4 w-4" />
            Ja, alles löschen
          </button>
        </div>
      </div>
    </div>
  );
}
