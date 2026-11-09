import { cx } from '../lib/utils';
import { Icon } from './Icons';

export interface StepperProps {
  profileDone: boolean;
  jobDone: boolean;
  aiDone: boolean;
  exportDone: boolean;
}

export function Stepper({ profileDone, jobDone, aiDone, exportDone }: StepperProps) {
  const steps = [
    { label: 'Profil', href: '#profil', done: profileDone },
    { label: 'Stelle', href: '#stelle', done: jobDone },
    { label: 'KI', href: '#ki', done: aiDone },
    { label: 'Export', href: '#ergebnisse', done: exportDone },
  ];

  return (
    <nav
      aria-label="Fortschritt der Bewerbung"
      className="grid grid-cols-2 gap-2 sm:grid-cols-4"
    >
      {steps.map((step, index) => (
        <a
          key={step.label}
          href={step.href}
          className={cx(
            'group flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-xs transition-colors focus-visible:ring-2 focus-visible:ring-accent/45 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
            step.done
              ? 'border-ok/20 bg-ok/[.035] text-ink'
              : 'border-line bg-white/[.018] text-muted hover:border-line-strong hover:text-ink',
          )}
          title={step.done ? `${step.label}: erledigt` : `${step.label}: offen`}
        >
          <span
            className={cx(
              'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border font-mono text-[10px]',
              step.done
                ? 'border-ok/30 bg-ok/10 text-ok'
                : 'border-line bg-white/[.02] text-faint',
            )}
            aria-hidden="true"
          >
            {step.done ? <Icon name="check" className="h-3 w-3" /> : index + 1}
          </span>
          <span className="truncate">{step.label}</span>
          <span className="ml-auto hidden text-[10px] text-faint lg:inline">
            {step.done ? 'Fertig' : 'Offen'}
          </span>
        </a>
      ))}
    </nav>
  );
}
