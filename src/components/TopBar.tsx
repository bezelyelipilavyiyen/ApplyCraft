import { Icon } from './Icons';
import { Brand } from './Ui';

export function TopBar({ onRequestWipe }: { onRequestWipe: () => void }) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/[.055] bg-canvas/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-5 sm:h-16 sm:px-8">
        <a
          href="#top"
          className="rounded-lg focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-4 focus-visible:ring-offset-canvas"
          aria-label="ApplyCraft – zum Seitenanfang"
        >
          <Brand />
        </a>

        <div className="flex items-center gap-2">
          <span
            className="hidden items-center gap-1.5 rounded-full border border-line bg-white/[.025] px-3 py-1.5 text-[11px] text-muted sm:inline-flex"
            title="Keine Speicherung, keine Server von ApplyCraft, kein Tracking."
          >
            <span className="h-1.5 w-1.5 rounded-full bg-ok/80" aria-hidden="true" />
            Nur im Browser
          </span>
          <button
            type="button"
            onClick={onRequestWipe}
            className="btn btn-danger btn-sm"
            aria-label="Alle Daten jetzt löschen"
          >
            <Icon name="trash" className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Alle Daten löschen</span>
            <span className="sm:hidden">Löschen</span>
          </button>
        </div>
      </div>
    </header>
  );
}
