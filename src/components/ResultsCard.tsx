import { useEffect } from 'react';
import type { DocumentKind, DocumentSet } from '../lib/types';
import { DOCUMENT_KINDS, DOCUMENT_LABELS } from '../lib/types';
import { countWords, formatDateTimeDE } from '../lib/utils';
import { Icon } from './Icons';
import { InlineNote, SectionCard, StatusPill } from './Ui';

export interface ResultsCardProps {
  documents: DocumentSet;
  activeKind: DocumentKind | null;
  onActiveKindChange: (kind: DocumentKind | null) => void;
  onContentChange: (kind: DocumentKind, content: string) => void;
  onExportPdf: (kind: DocumentKind) => void;
  onExportTxt: (kind: DocumentKind) => void;
  onExportAllTxt: () => void;
}

export function ResultsCard({
  documents,
  activeKind,
  onActiveKindChange,
  onContentChange,
  onExportPdf,
  onExportTxt,
  onExportAllTxt,
}: ResultsCardProps) {
  const available = DOCUMENT_KINDS.filter((kind) => Boolean(documents[kind]));
  const active = activeKind ? documents[activeKind] : undefined;
  const hasDocuments = available.length > 0;

  useEffect(() => {
    if (activeKind && documents[activeKind]) return;
    const first = DOCUMENT_KINDS.find((kind) => documents[kind]) ?? null;
    if (first !== activeKind) onActiveKindChange(first);
  }, [documents, activeKind, onActiveKindChange]);

  return (
    <SectionCard
      id="ergebnisse"
      index="06"
      title="Ergebnisse"
      description="Bearbeite die Texte direkt und exportiere sie als PDF oder TXT."
      action={
        <StatusPill tone={hasDocuments ? 'warn' : 'neutral'}>
          {hasDocuments ? 'Nicht gespeichert' : 'Noch leer'}
        </StatusPill>
      }
    >
      {!hasDocuments ? (
        <div className="rounded-xl border border-dashed border-line bg-white/[.012] px-6 py-12 text-center">
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-accent/20 bg-accent/[.06] text-accent">
            <Icon name="sparkles" className="h-5 w-5" />
          </span>
          <p className="mt-3 text-sm font-medium text-ink">Noch kein Dokument</p>
          <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-faint">
            Fülle Profil und Stelle aus, verbinde eine KI und starte die Generierung. Anschreiben
            und Lebenslauf erscheinen dann hier als bearbeitbarer Text.
          </p>
          <a href="#generieren" className="btn btn-secondary btn-sm mt-4">
            Zum Generator
          </a>
        </div>
      ) : active ? (
        <div className="space-y-3.5">
          <InlineNote tone="warn" icon="alert">
            Diese Dokumente sind nicht gespeichert. Ein Neuladen oder Schließen des Tabs löscht
            sie. Exportiere sie vorher.
          </InlineNote>

          <div
            role="group"
            aria-label="Dokument auswählen"
            className="flex flex-wrap gap-1 rounded-xl border border-line bg-[#0a0c0e] p-1"
          >
            {available.map((kind) => (
              <button
                key={kind}
                type="button"
                aria-pressed={active.kind === kind}
                onClick={() => onActiveKindChange(kind)}
                className={[
                  'choice inline-flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap',
                  active.kind === kind ? 'choice-active' : 'choice-idle',
                ].join(' ')}
              >
                <Icon
                  name={kind === 'email' ? 'mail' : 'fileText'}
                  className="h-3.5 w-3.5"
                />
                {DOCUMENT_LABELS[kind]}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-faint">
            <span>
              {countWords(active.content).toLocaleString('de-DE')} Wörter · zuletzt erstellt{' '}
              {formatDateTimeDE(active.generatedAt)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-warn/80" aria-hidden="true" />
              Nur im Arbeitsspeicher
            </span>
          </div>

          <textarea
            value={active.content}
            onChange={(event) => onContentChange(active.kind, event.target.value)}
            className="doc-editor min-h-[380px]"
            rows={18}
            spellCheck
            aria-label={`${DOCUMENT_LABELS[active.kind]} bearbeiten`}
          />

          <div className="flex flex-wrap items-center gap-2">
            {active.kind !== 'email' ? (
              <button
                type="button"
                onClick={() => onExportPdf(active.kind)}
                disabled={!active.content.trim()}
                className="btn btn-primary btn-sm"
              >
                <Icon name="download" className="h-3.5 w-3.5" />
                PDF
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => onExportTxt(active.kind)}
              disabled={!active.content.trim()}
              className="btn btn-secondary btn-sm"
            >
              <Icon name="download" className="h-3.5 w-3.5" />
              TXT
            </button>
            {available.length > 1 ? (
              <button
                type="button"
                onClick={onExportAllTxt}
                className="btn btn-ghost btn-sm ml-auto"
              >
                <Icon name="fileText" className="h-3.5 w-3.5" />
                Alle als TXT
              </button>
            ) : null}
          </div>

          {active.kind === 'email' ? (
            <p className="text-[11px] leading-relaxed text-faint">
              Für die E-Mail ist kein PDF-Export vorgesehen – übernimm den Text einfach in dein
              Mailprogramm.
            </p>
          ) : (
            <p className="text-[11px] leading-relaxed text-faint">
              PDF und TXT enthalten den aktuell bearbeiteten Text inklusive Briefkopf. Prüfe vor
              dem Versand alle Angaben.
            </p>
          )}
        </div>
      ) : null}
    </SectionCard>
  );
}
