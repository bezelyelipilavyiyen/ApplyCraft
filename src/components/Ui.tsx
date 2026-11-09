import type { ReactNode } from 'react';
import { cx } from '../lib/utils';
import { Icon, type IconName } from './Icons';

export interface SectionCardProps {
  id?: string;
  index: string;
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

export function SectionCard({
  id,
  index,
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
}: SectionCardProps) {
  return (
    <section id={id} className={cx('card scroll-mt-24', className)}>
      <div className="card-header">
        <div className="flex min-w-0 gap-3">
          <span className="step-index" aria-hidden="true">
            {index}
          </span>
          <div className="min-w-0">
            <h2 className="text-[15px] font-semibold tracking-tight text-ink">{title}</h2>
            {description ? (
              <p className="mt-1 max-w-prose text-xs leading-relaxed text-muted">{description}</p>
            ) : null}
          </div>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className={cx('card-body', bodyClassName)}>{children}</div>
    </section>
  );
}

type PillTone = 'ok' | 'warn' | 'danger' | 'neutral' | 'accent';

const PILL_STYLES: Record<PillTone, string> = {
  ok: 'border-ok/25 bg-ok/[.07] text-ok',
  warn: 'border-warn/25 bg-warn/[.07] text-warn',
  danger: 'border-danger/25 bg-danger/[.07] text-danger',
  neutral: 'border-line bg-white/[.03] text-muted',
  accent: 'border-accent/25 bg-accent/[.07] text-accent',
};

export function StatusPill({
  tone,
  children,
  className,
}: {
  tone: PillTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10.5px] font-medium',
        PILL_STYLES[tone],
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}

type NoteTone = 'info' | 'warn' | 'danger' | 'success';

const NOTE_STYLES: Record<NoteTone, string> = {
  info: 'border-accent/20 bg-accent/[.05]',
  warn: 'border-warn/25 bg-warn/[.055]',
  danger: 'border-danger/25 bg-danger/[.055]',
  success: 'border-ok/25 bg-ok/[.055]',
};

const NOTE_ICON_STYLES: Record<NoteTone, string> = {
  info: 'text-accent',
  warn: 'text-warn',
  danger: 'text-danger',
  success: 'text-ok',
};

const NOTE_ICONS: Record<NoteTone, IconName> = {
  info: 'info',
  warn: 'alert',
  danger: 'alert',
  success: 'check',
};

export function InlineNote({
  tone = 'info',
  icon,
  children,
  className,
}: {
  tone?: NoteTone;
  icon?: IconName;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        'flex items-start gap-2.5 rounded-xl border p-3 text-xs leading-relaxed text-ink/80',
        NOTE_STYLES[tone],
        className,
      )}
    >
      <Icon
        name={icon ?? NOTE_ICONS[tone]}
        className={cx('mt-px h-4 w-4 shrink-0', NOTE_ICON_STYLES[tone])}
      />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export interface FieldProps {
  label: string;
  htmlFor: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}

export function Field({
  label,
  htmlFor,
  required,
  hint,
  error,
  children,
  className,
}: FieldProps) {
  return (
    <div className={className}>
      <label className="field-label" htmlFor={htmlFor}>
        {label}
        {required ? (
          <span className="text-accent/90" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 text-[11.5px] leading-relaxed text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-[11.5px] leading-relaxed text-faint">{hint}</p>
      ) : null}
    </div>
  );
}

export function Spinner({ className = 'h-4 w-4' }: { className?: string }) {
  return <Icon name="spinner" className={cx('animate-spin', className)} />;
}

export function Brand({ className }: { className?: string }) {
  return (
    <span className={cx('inline-flex items-center gap-2.5', className)}>
      <span className="brand-mark" aria-hidden="true">
        A
      </span>
      <span className="text-[17px] font-semibold tracking-[-0.02em] text-ink">ApplyCraft</span>
    </span>
  );
}
