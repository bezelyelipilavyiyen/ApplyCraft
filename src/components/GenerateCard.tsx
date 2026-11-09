import type { DocumentKind } from '../lib/types';
import { Icon } from './Icons';
import { InlineNote, SectionCard, Spinner, StatusPill } from './Ui';

export interface GenerateCardProps {
  connected: boolean;
  autoDelete: boolean;
  onAutoDeleteChange: (value: boolean) => void;
  onGenerate: (kinds: DocumentKind[]) => void;
  busy: boolean;
  statusText: string | null;
  onCancel: () => void;
  errors: string[];
}

export function GenerateCard({
  connected,
  autoDelete,
  onAutoDeleteChange,
  onGenerate,
  busy,
  statusText,
  onCancel,
  errors,
}: GenerateCardProps) {
  return (
    <SectionCard
      id="generieren"
      index="05"
      title="Dokumente generieren"
      description="Anschreiben und Lebenslauf entstehen aus deinem Profil und der konkreten Stelle."
      action={
        <StatusPill tone={busy ? 'accent' : connected ? 'ok' : 'neutral'}>
          {busy ? 'Läuft' : connected ? 'Bereit' : 'KI fehlt'}
        </StatusPill>
      }
    >
      {!connected ? (
        <InlineNote tone="warn" icon="key" className="mb-4">
          Für die Generierung fehlt eine KI-Verbindung.{' '}
          <a href="#ki" className="link">
            Jetzt verbinden
          </a>
          .
        </InlineNote>
      ) : null}

      {errors.length > 0 ? (
        <InlineNote tone="danger" className="mb-4">
          <p className="font-medium text-ink/90">Bitte prüfe noch:</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-4">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </InlineNote>
      ) : null}

      <div className="space-y-2.5">
        <button
          type="button"
          onClick={() => onGenerate(['coverLetter', 'resume'])}
          disabled={!connected || busy}
          className="btn btn-primary h-11 w-full"
        >
          {busy ? (
            <Spinner className="h-4 w-4" />
          ) : (
            <Icon name="sparkles" className="h-4 w-4" />
          )}
          Anschreiben &amp; Lebenslauf
        </button>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => onGenerate(['coverLetter'])}
            disabled={!connected || busy}
            className="btn btn-secondary"
          >
            <Icon name="fileText" className="h-4 w-4" />
            Anschreiben
          </button>
          <button
            type="button"
            onClick={() => onGenerate(['resume'])}
            disabled={!connected || busy}
            className="btn btn-secondary"
          >
            <Icon name="fileText" className="h-4 w-4" />
            Lebenslauf
          </button>
        </div>

        <button
          type="button"
          onClick={() => onGenerate(['email'])}
          disabled={!connected || busy}
          className="btn btn-ghost w-full border border-dashed border-line text-xs"
        >
          <Icon name="mail" className="h-3.5 w-3.5" />
          Bewerbungs-E-Mail (optional)
        </button>
      </div>

      {busy && statusText ? (
        <div
          className="mt-4 flex items-start gap-3 rounded-xl border border-accent/20 bg-accent/[.05] p-3"
          role="status"
          aria-live="polite"
        >
          <Spinner className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-ink">{statusText}</p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-faint">
              Die Anfrage läuft direkt beim KI-Anbieter.
            </p>
          </div>
          <button type="button" onClick={onCancel} className="btn btn-ghost btn-sm shrink-0">
            Abbrechen
          </button>
        </div>
      ) : null}

      <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-white/[.018] p-3.5 transition-colors hover:border-line-strong">
        <input
          type="checkbox"
          checked={autoDelete}
          onChange={(event) => onAutoDeleteChange(event.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-line bg-transparent accent-accent"
          aria-describedby="auto-delete-description"
        />
        <span>
          <span className="block text-xs font-medium leading-relaxed text-ink">
            Meine persönlichen Daten und Eingaben nach der Generierung automatisch löschen.
          </span>
          <span
            id="auto-delete-description"
            className="mt-1 block text-[11px] leading-relaxed text-faint"
          >
            Entfernt Profil, Lebenslauf-Text und Stelle aus dem Arbeitsspeicher. Die Ergebnisse
            bleiben zum Bearbeiten und Exportieren. Standardmäßig aktiv.
          </span>
        </span>
      </label>

      {autoDelete ? (
        <InlineNote tone="info" icon="shield" className="mt-3">
          Nach der Generierung sind deine Eingaben weg. Erzeuge Anschreiben und Lebenslauf deshalb
          am besten in einem Schritt. Daten, die bereits an den KI-Anbieter übertragen wurden,
          kann das Löschen im Browser nicht zurückholen.
        </InlineNote>
      ) : null}

      <p className="mt-4 flex items-start gap-2 text-[11px] leading-relaxed text-faint">
        <Icon name="info" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Pro Dokument entsteht eine Anfrage an deinen KI-Anbieter. Dabei können Kosten nach dessen
        Preisliste anfallen.
      </p>
    </SectionCard>
  );
}
