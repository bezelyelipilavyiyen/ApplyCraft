import { Icon, type IconName } from './Icons';
import { StatusPill } from './Ui';

export interface PrivacySectionProps {
  autoDelete: boolean;
  onRequestWipe: () => void;
}

const FACTS: Array<{ icon: IconName; title: string; text: string }> = [
  {
    icon: 'shield',
    title: 'Nur Arbeitsspeicher',
    text: 'Formular, PDF-Text und Ergebnisse liegen ausschließlich im RAM. Kein localStorage, keine Cookies, keine Datenbank, kein Tracking.',
  },
  {
    icon: 'fileText',
    title: 'PDF bleibt lokal',
    text: 'Ein hochgeladener Lebenslauf wird im Browser ausgelesen. Die Datei wird nicht an einen ApplyCraft-Server gesendet – es gibt keinen.',
  },
  {
    icon: 'server',
    title: 'KI direkt',
    text: 'KI-Anfragen gehen direkt an den von dir gewählten Anbieter. Dort gelten dessen Datenschutzbestimmungen und Aufbewahrungsfristen.',
  },
  {
    icon: 'trash',
    title: 'Löschen wirkt lokal',
    text: 'Checkbox und Button entfernen Daten aus dieser Sitzung. Bereits übertragene Daten kann der Browser nicht zurückrufen.',
  },
];

export function PrivacySection({ autoDelete, onRequestWipe }: PrivacySectionProps) {
  return (
    <section id="datenschutz" className="mt-8 scroll-mt-24 sm:mt-10">
      <div className="relative overflow-hidden rounded-3xl border border-line bg-panel/70 p-6 sm:p-8 lg:p-10">
        <div
          className="pointer-events-none absolute -bottom-28 -left-24 h-64 w-64 rounded-full bg-accent/[.055] blur-3xl"
          aria-hidden="true"
        />

        <div className="relative grid gap-8 lg:grid-cols-[1.25fr_.75fr] lg:gap-12">
          <div>
            <span className="eyebrow">Datenschutz</span>
            <h2 className="mt-3 text-balance text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              Deine Daten bleiben deine Daten.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
              ApplyCraft ist eine statische Web-App: keine Anmeldung, keine Datenbank, keine
              Bewerbungshistorie. Was du eingibst, lebt nur in dieser Browser-Sitzung.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {FACTS.map((fact) => (
                <div key={fact.title} className="flex gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-white/[.03] text-accent">
                    <Icon name={fact.icon} className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs font-medium text-ink">{fact.title}</p>
                    <p className="mt-1 text-[11.5px] leading-relaxed text-faint">{fact.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <aside className="flex flex-col rounded-2xl border border-line bg-canvas/50 p-5">
            <div className="flex items-center justify-between gap-3">
              <span className="eyebrow">Kontrolle</span>
              <StatusPill tone={autoDelete ? 'ok' : 'warn'}>
                {autoDelete ? 'Auto-Löschung an' : 'Auto-Löschung aus'}
              </StatusPill>
            </div>
            <h3 className="mt-3 text-base font-semibold tracking-tight text-ink">
              Alles löschen, jederzeit.
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Der Button entfernt alle Formularfelder, den ausgelesenen Lebenslauf, die
              Stellenanzeige, generierte Dokumente und die KI-Verbindung aus dem Arbeitsspeicher.
            </p>

            <button type="button" onClick={onRequestWipe} className="btn btn-danger mt-4 w-full">
              <Icon name="trash" className="h-4 w-4" />
              Alle Daten jetzt löschen
            </button>

            <ul className="mt-4 space-y-1.5 text-[11px] text-faint">
              <li className="flex items-center gap-2">
                <Icon name="check" className="h-3.5 w-3.5 shrink-0 text-ok/70" />
                Formular, PDF-Text und Stelle
              </li>
              <li className="flex items-center gap-2">
                <Icon name="check" className="h-3.5 w-3.5 shrink-0 text-ok/70" />
                Generierte Dokumente und Vorschauen
              </li>
              <li className="flex items-center gap-2">
                <Icon name="check" className="h-3.5 w-3.5 shrink-0 text-ok/70" />
                KI-Verbindung inklusive Schlüssel
              </li>
            </ul>

            <p className="mt-auto pt-4 text-[10.5px] leading-relaxed text-faint">
              Ein Neuladen des Tabs löscht ohnehin alles. Bereits an einen KI-Anbieter übertragene
              Daten bleiben dort gemäß dessen Bedingungen bestehen.
            </p>
          </aside>
        </div>
      </div>
    </section>
  );
}
