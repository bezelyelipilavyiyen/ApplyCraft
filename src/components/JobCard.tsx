import { useState } from 'react';
import type { EditableJobField } from '../hooks/useSession';
import type { ActionState } from '../lib/asyncState';
import type { JobPosting } from '../lib/types';
import { JOB_LIMITS } from '../lib/types';
import { cx } from '../lib/utils';
import { Icon } from './Icons';
import { Field, InlineNote, SectionCard, Spinner, StatusPill } from './Ui';

export interface JobCardProps {
  job: JobPosting;
  onChange: (field: EditableJobField, value: string) => void;
  fetchState: ActionState;
  onFetch: () => void;
  aiConnected: boolean;
  analysisState: ActionState;
  onAnalyze: () => void;
}

type JobMode = 'url' | 'text';

export function JobCard({
  job,
  onChange,
  fetchState,
  onFetch,
  aiConnected,
  analysisState,
  onAnalyze,
}: JobCardProps) {
  const [mode, setMode] = useState<JobMode>('url');
  const hasText = job.text.trim().length > 0;
  const hasContext =
    hasText || (job.role.trim().length > 0 && job.requirements.trim().length > 0);
  const fetching = fetchState.status === 'loading';
  const analyzing = analysisState.status === 'loading';

  return (
    <SectionCard
      id="stelle"
      index="04"
      title="Stellenanzeige"
      description="URL einfügen oder den Text kopieren. Übernommen werden nur Angaben, die dort wirklich stehen."
      action={
        <StatusPill tone={hasContext ? 'ok' : 'neutral'}>
          {hasContext ? 'Vorhanden' : 'Fehlt'}
        </StatusPill>
      }
    >
      <div
        role="group"
        aria-label="Art der Stelleneingabe"
        className="flex gap-1 rounded-xl border border-line bg-[#0a0c0e] p-1"
      >
        <button
          type="button"
          aria-pressed={mode === 'url'}
          onClick={() => setMode('url')}
          className={cx(
            'choice inline-flex flex-1 items-center justify-center gap-1.5',
            mode === 'url' ? 'choice-active' : 'choice-idle',
          )}
        >
          <Icon name="link" className="h-3.5 w-3.5" />
          Per URL
        </button>
        <button
          type="button"
          aria-pressed={mode === 'text'}
          onClick={() => setMode('text')}
          className={cx(
            'choice inline-flex flex-1 items-center justify-center gap-1.5',
            mode === 'text' ? 'choice-active' : 'choice-idle',
          )}
        >
          <Icon name="fileText" className="h-3.5 w-3.5" />
          Text einfügen
        </button>
      </div>

      {mode === 'url' ? (
        <div className="mt-4">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (!fetching) onFetch();
            }}
            className="flex flex-col gap-2 sm:flex-row"
          >
            <div className="min-w-0 flex-1">
              <label className="sr-only" htmlFor="job-url">
                URL der Stellenanzeige
              </label>
              <div className="relative">
                <Icon
                  name="link"
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint"
                />
                <input
                  id="job-url"
                  name="job-url"
                  type="url"
                  inputMode="url"
                  value={job.url}
                  onChange={(event) => onChange('url', event.target.value)}
                  className="input pl-10"
                  placeholder="https://firma.de/jobs/123"
                  autoComplete="off"
                  spellCheck={false}
                  maxLength={JOB_LIMITS.url}
                />
              </div>
            </div>
            <button
              type="submit"
              className="btn btn-secondary shrink-0"
              disabled={fetching || !job.url.trim()}
            >
              {fetching ? <Spinner className="h-4 w-4" /> : <Icon name="download" className="h-4 w-4" />}
              {fetching ? 'Lädt …' : 'Auslesen'}
            </button>
          </form>

          <p className="mt-2 text-[11px] leading-relaxed text-faint">
            Der Browser lädt die Seite direkt. Viele Jobportale blockieren das (CORS) – dann den
            Text einfügen. Bei verbundener KI kannst du die Anzeige anschließend analysieren.
          </p>

          {fetching ? (
            <InlineNote tone="info" icon="spinner" className="mt-3">
              Stellenanzeige wird geladen und lesbar gemacht …
            </InlineNote>
          ) : null}

          {fetchState.status === 'error' ? (
            <InlineNote tone="danger" className="mt-3">
              <p>{fetchState.message}</p>
              <button
                type="button"
                onClick={() => setMode('text')}
                className="link mt-1.5 inline-flex items-center gap-1 text-[11.5px]"
              >
                Text stattdessen einfügen
                <Icon name="arrowRight" className="h-3 w-3" />
              </button>
            </InlineNote>
          ) : null}

          {fetchState.status === 'success' ? (
            <InlineNote tone="success" className="mt-3">
              <p>{fetchState.message}</p>
              {hasText ? (
                <button
                  type="button"
                  onClick={() => setMode('text')}
                  className="link mt-1.5 inline-flex items-center gap-1 text-[11.5px]"
                >
                  Ausgelesenen Text prüfen oder bearbeiten
                  <Icon name="arrowRight" className="h-3 w-3" />
                </button>
              ) : null}
            </InlineNote>
          ) : null}

          {hasText && job.source === 'url' && !fetching ? (
            <details className="mt-3 rounded-xl border border-line bg-white/[.018] px-3.5 py-2.5">
              <summary className="cursor-pointer text-[11.5px] font-medium text-muted marker:text-faint">
                Ausgelesenen Text ansehen ({job.text.length.toLocaleString('de-DE')} Zeichen)
              </summary>
              <pre className="mt-2 max-h-44 overflow-auto whitespace-pre-wrap font-sans text-[11.5px] leading-relaxed text-faint">
                {job.text.slice(0, 3000)}
                {job.text.length > 3000 ? '\n\n…' : ''}
              </pre>
            </details>
          ) : null}
        </div>
      ) : (
        <div className="mt-4">
          <label className="sr-only" htmlFor="job-text">
            Text der Stellenanzeige
          </label>
          <textarea
            id="job-text"
            name="job-text"
            rows={8}
            value={job.text}
            onChange={(event) => onChange('text', event.target.value)}
            className="textarea"
            placeholder="Füge hier die vollständige Stellenanzeige ein – Aufgaben, Anforderungen, Unternehmen …"
            maxLength={JOB_LIMITS.text}
          />
          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="text-[11px] leading-relaxed text-faint">
              Nur Fakten aus diesem Text werden verwendet.
            </p>
            <p className="shrink-0 font-mono text-[10.5px] text-faint">
              {job.text.length.toLocaleString('de-DE')} / 30.000
            </p>
          </div>
        </div>
      )}

      <div className="mt-5 rounded-xl border border-line bg-white/[.02] p-3.5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-ink">Anzeige automatisch auswerten</p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-faint">
              Eine KI-Anfrage extrahiert Unternehmen, Rolle, Anforderungen und Aufgaben.
            </p>
          </div>
          <button
            type="button"
            onClick={onAnalyze}
            disabled={!aiConnected || !hasText || analyzing || fetching}
            className="btn btn-secondary btn-sm shrink-0"
          >
            {analyzing ? (
              <Spinner className="h-3.5 w-3.5" />
            ) : (
              <Icon name="sparkles" className="h-3.5 w-3.5" />
            )}
            {analyzing ? 'Analysiert …' : 'Analysieren'}
          </button>
        </div>

        {!aiConnected ? (
          <p className="mt-2 text-[11px] text-faint">
            Dafür musst du zuerst{' '}
            <a href="#ki" className="link">
              eine KI verbinden
            </a>
            . Die Felder unten kannst du auch manuell ausfüllen.
          </p>
        ) : null}

        {analysisState.status === 'success' ? (
          <InlineNote tone="success" className="mt-3">
            {analysisState.message}
          </InlineNote>
        ) : null}
        {analysisState.status === 'error' ? (
          <InlineNote tone="danger" className="mt-3">
            {analysisState.message}
          </InlineNote>
        ) : null}
      </div>

      <div className="mt-5">
        <p className="mb-3 text-[11px] leading-relaxed text-faint">
          Diese Angaben werden für Anschreiben, Lebenslauf und Dateinamen verwendet. Bitte nach
          einer Analyse prüfen und bei Bedarf korrigieren.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Unternehmen" htmlFor="job-company">
            <input
              id="job-company"
              name="job-company"
              type="text"
              value={job.company}
              onChange={(event) => onChange('company', event.target.value)}
              className="input"
              placeholder="z. B. Muster GmbH"
              maxLength={JOB_LIMITS.company}
            />
          </Field>

          <Field label="Stellenbezeichnung" htmlFor="job-role">
            <input
              id="job-role"
              name="job-role"
              type="text"
              value={job.role}
              onChange={(event) => onChange('role', event.target.value)}
              className="input"
              placeholder="z. B. Senior Product Designerin"
              maxLength={JOB_LIMITS.role}
            />
          </Field>

          <Field
            label="Anforderungen"
            htmlFor="job-requirements"
            hint="Eine Anforderung pro Zeile."
          >
            <textarea
              id="job-requirements"
              name="job-requirements"
              rows={4}
              value={job.requirements}
              onChange={(event) => onChange('requirements', event.target.value)}
              className="textarea"
              placeholder={'z. B.\nMehrjährige Erfahrung in Produktdesign\nSichere Deutsch- und Englischkenntnisse'}
              maxLength={JOB_LIMITS.requirements}
            />
          </Field>

          <Field label="Aufgabenbereich" htmlFor="job-tasks" hint="Eine Aufgabe pro Zeile.">
            <textarea
              id="job-tasks"
              name="job-tasks"
              rows={4}
              value={job.tasks}
              onChange={(event) => onChange('tasks', event.target.value)}
              className="textarea"
              placeholder={'z. B.\nDesign von Web-Oberflächen\nZusammenarbeit mit Entwicklung und Produkt'}
              maxLength={JOB_LIMITS.tasks}
            />
          </Field>
        </div>
      </div>
    </SectionCard>
  );
}
