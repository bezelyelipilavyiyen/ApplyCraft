import type { Notice } from '../hooks/useNotice';
import { cx } from '../lib/utils';
import { Icon, type IconName } from './Icons';

const TONE_STYLES: Record<
  Notice['tone'],
  { icon: IconName; frame: string; iconClass: string }
> = {
  success: {
    icon: 'check',
    frame: 'border-ok/25',
    iconClass: 'text-ok',
  },
  error: {
    icon: 'alert',
    frame: 'border-danger/30',
    iconClass: 'text-danger',
  },
  info: {
    icon: 'info',
    frame: 'border-accent/25',
    iconClass: 'text-accent',
  },
};

export function NotificationBar({
  notice,
  onDismiss,
}: {
  notice: Notice;
  onDismiss: () => void;
}) {
  const styles = TONE_STYLES[notice.tone];

  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex justify-center sm:inset-x-auto sm:bottom-6 sm:right-6 sm:justify-end">
      <div
        role={notice.tone === 'error' ? 'alert' : 'status'}
        aria-live="polite"
        className={cx(
          'fade-in pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl border bg-panel/95 p-3.5 shadow-[0_24px_60px_-20px_rgba(0,0,0,.9)] backdrop-blur-xl sm:w-[400px]',
          styles.frame,
        )}
      >
        <span
          className={cx(
            'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line bg-white/[.03]',
            styles.iconClass,
          )}
        >
          <Icon name={styles.icon} className="h-4 w-4" />
        </span>
        <p className="min-w-0 flex-1 text-xs leading-relaxed text-ink/90">{notice.message}</p>
        <button
          type="button"
          onClick={onDismiss}
          className="btn btn-ghost -mr-1 -mt-1 h-7 w-7 shrink-0 rounded-lg p-0"
          aria-label="Hinweis schließen"
        >
          <Icon name="x" className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
