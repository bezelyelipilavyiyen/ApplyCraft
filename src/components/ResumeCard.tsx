import { useRef, useState, type DragEvent } from 'react';
import { describeResumeError } from '../lib/resume/errors';
import { countWords, cx } from '../lib/utils';
import { Icon } from './Icons';
import { InlineNote, SectionCard, Spinner } from './Ui';

export interface ResumeCardProps {
  resumeText: string;
  fileName: string;
  pages: number | null;
  truncated: boolean;
  onParsed: (text: string, fileName: string, pages: number, truncated: boolean) => void;
  onClear: () => void;
}

export function ResumeCard({
  resumeText,
  fileName,
  pages,
  truncated,
  onParsed,
  onClear,
}: ResumeCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showText, setShowText] = useState(false);
  const hasResume = resumeText.trim().length > 0;

  async function handleFile(file: File) {
    setError(null);

    if (!file.name.toLowerCase().endsWith('.pdf') && !file.type.includes('pdf')) {
      setError('Bitte wähle eine PDF-Datei aus.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Die Datei ist größer als 10 MB. Bitte wähle ein kleineres PDF.');
      return;
    }

    setBusy(true);
    try {
      // pdf.js is only downloaded when a PDF is actually selected.
      const { extractResumeText } = await import('../lib/resume/pdfText');
      const result = await extractResumeText(file);
      onParsed(result.text, file.name, result.pages, result.truncated);
      setShowText(false);
    } catch (parseError) {
      setError(describeResumeError(parseError));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    if (busy) return;
    const file = event.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  }

  function handleClear() {
    setError(null);
    setShowText(false);
    onClear();
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <SectionCard
      id="lebenslauf"
      index="03"
      title="Lebenslauf hochladen"
      description="Optional: ein bestehendes PDF hilft der KI, deine Stationen und Formulierungen zu treffen."
      action={<span className="text-[10.5px] text-faint">Optional</span>}
    >
      <input
        ref={inputRef}
        id="resume-file"
        name="resume"
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        disabled={busy}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />

      {hasResume ? (
        <div className="rounded-xl border border-line bg-[#0a0c0e] p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-accent/20 bg-accent/[.06] text-accent">
                <Icon name="fileText" className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">{fileName || 'Lebenslauf.pdf'}</p>
                <p className="mt-0.5 text-[11.5px] text-faint">
                  {pages ? `${pages} Seiten` : 'PDF'} · {countWords(resumeText).toLocaleString('de-DE')} Wörter
                  · lokal ausgelesen
                  {truncated ? ' (gekürzt)' : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="btn btn-secondary btn-sm"
                disabled={busy}
              >
                Ersetzen
              </button>
              <button type="button" onClick={handleClear} className="btn btn-ghost btn-sm">
                Entfernen
              </button>
            </div>
          </div>

          {truncated ? (
            <InlineNote tone="warn" className="mt-3">
              Das PDF hatte mehr als 15 Seiten. Es wurden nur die ersten 15 Seiten ausgelesen.
            </InlineNote>
          ) : null}

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
            <button
              type="button"
              onClick={() => setShowText((current) => !current)}
              className="inline-flex items-center gap-1 text-[11.5px] text-muted underline decoration-line-strong underline-offset-4 transition-colors hover:text-ink"
            >
              <Icon name="eye" className="h-3 w-3" />
              {showText ? 'Text ausblenden' : 'Ausgelesenen Text prüfen'}
            </button>
            <span className="text-[11px] text-faint">Die Datei wird nicht hochgeladen.</span>
          </div>

          {showText ? (
            <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap rounded-lg border border-line bg-canvas/60 p-3 font-sans text-[11.5px] leading-relaxed text-muted">
              {resumeText.slice(0, 4000)}
              {resumeText.length > 4000 ? '\n\n…' : ''}
            </pre>
          ) : null}
        </div>
      ) : (
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={cx(
            'rounded-xl border border-dashed transition-colors',
            dragging
              ? 'border-accent/50 bg-accent/[.05]'
              : 'border-line bg-[#0a0c0e] hover:border-line-strong',
          )}
        >
          <label
            htmlFor="resume-file"
            className={cx(
              'flex cursor-pointer flex-col items-center px-6 py-8 text-center',
              busy && 'pointer-events-none opacity-60',
            )}
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-white/[.03] text-accent">
              {busy ? <Spinner className="h-5 w-5" /> : <Icon name="upload" className="h-5 w-5" />}
            </span>
            <span className="mt-3 text-sm font-medium text-ink">
              {busy ? 'PDF wird lokal gelesen …' : 'PDF auswählen oder hierher ziehen'}
            </span>
            <span className="mt-1 text-[11.5px] text-faint">
              Max. 10 MB · Text wird im Browser extrahiert
            </span>
          </label>
        </div>
      )}

      {busy && hasResume ? (
        <p className="mt-3 flex items-center gap-2 text-[11.5px] text-muted">
          <Spinner className="h-3.5 w-3.5" />
          Neue Datei wird lokal gelesen …
        </p>
      ) : null}

      {error ? (
        <InlineNote tone="danger" className="mt-3">
          {error}
        </InlineNote>
      ) : null}

      {!hasResume ? (
        <p className="mt-4 flex items-start gap-2 text-[11.5px] leading-relaxed text-faint">
          <Icon name="shield" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ok/70" />
          Gescannte oder passwortgeschützte PDFs können keinen Text liefern. Trage die Angaben dann
          einfach im Profil ein.
        </p>
      ) : null}
    </SectionCard>
  );
}
