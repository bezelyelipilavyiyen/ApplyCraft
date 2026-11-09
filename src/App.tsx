import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AiConnectionCard } from './components/AiConnectionCard';
import { ConfirmDialog } from './components/ConfirmDialog';
import { Footer } from './components/Footer';
import { GenerateCard } from './components/GenerateCard';
import { Hero } from './components/Hero';
import { JobCard } from './components/JobCard';
import { NotificationBar } from './components/NotificationBar';
import { PrivacySection } from './components/PrivacySection';
import { ProfileCard } from './components/ProfileCard';
import { ResultsCard } from './components/ResultsCard';
import { ResumeCard } from './components/ResumeCard';
import { Stepper } from './components/Stepper';
import { TopBar } from './components/TopBar';
import { useNotice } from './hooks/useNotice';
import { useSession } from './hooks/useSession';
import { parseJobAnalysis } from './lib/ai/jobAnalysis';
import { createProvider } from './lib/ai/openai';
import { buildJobAnalysisRequest } from './lib/ai/prompts';
import { AiError, describeAiError } from './lib/ai/types';
import type { ActionState } from './lib/asyncState';
import { buildRequestForKind, createGeneratedDocument } from './lib/generation';
import { fetchJobPage, JobFetchError } from './lib/job/fetchJob';
import type {
  DocumentKind,
  DocumentSet,
  GeneratedDocument,
  ProviderConfig,
} from './lib/types';
import { DOCUMENT_KINDS, DOCUMENT_LABELS } from './lib/types';
import { cleanGeneratedText, isValidEmail } from './lib/utils';
import { validateGeneration } from './lib/validation';

const GENERATION_STATUS: Record<DocumentKind, string> = {
  coverLetter: 'Anschreiben wird formuliert …',
  resume: 'Lebenslauf wird erstellt …',
  email: 'Bewerbungs-E-Mail wird formuliert …',
};

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function App() {
  const {
    profile,
    job,
    resume,
    resumeText,
    documents,
    provider,
    autoDelete,
    hasInputs,
    hasDocuments,
    updateProfile,
    updateJob,
    setResumeText,
    clearResume,
    applyExtractedJob,
    applyJobAnalysis,
    connectProvider,
    disconnectProvider,
    setAutoDelete,
    addDocuments,
    updateDocumentContent,
    clearInputs,
    resetAll,
  } = useSession();

  const { notice, show, dismiss } = useNotice();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [activeKind, setActiveKind] = useState<DocumentKind | null>(null);
  const [busy, setBusy] = useState(false);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [generationErrors, setGenerationErrors] = useState<string[]>([]);
  const [jobFetchState, setJobFetchState] = useState<ActionState>({ status: 'idle' });
  const [jobAnalysisState, setJobAnalysisState] = useState<ActionState>({ status: 'idle' });
  const [uiResetKey, setUiResetKey] = useState(0);

  const abortRef = useRef<AbortController | null>(null);
  const generationTokenRef = useRef(0);
  const dataEpochRef = useRef(0);

  const handleGenerate = useCallback(
    async (kinds: DocumentKind[]) => {
      if (abortRef.current) return;

      if (!provider) {
        setGenerationErrors(['Verbinde zuerst eine KI.']);
        return;
      }

      const issues = validateGeneration(profile, resumeText, job);
      if (issues.length > 0) {
        setGenerationErrors(issues);
        return;
      }

      let client: ReturnType<typeof createProvider>;
      try {
        client = createProvider(provider);
      } catch (error) {
        const message = describeAiError(error);
        setGenerationErrors([message]);
        show('error', message);
        return;
      }

      const token = generationTokenRef.current + 1;
      generationTokenRef.current = token;
      const controller = new AbortController();
      abortRef.current = controller;

      setBusy(true);
      setStatusText(GENERATION_STATUS[kinds[0]]);
      setGenerationErrors([]);

      const generated: DocumentSet = {};
      const failures: string[] = [];

      try {
        for (const kind of kinds) {
          if (token !== generationTokenRef.current) return;
          setStatusText(GENERATION_STATUS[kind]);

          try {
            const request = buildRequestForKind(kind, profile, resumeText, job);
            const raw = await client.complete({ ...request, signal: controller.signal });
            const content = cleanGeneratedText(raw);
            if (!content) {
              throw new AiError('empty', 'Die KI hat ein leeres Dokument geliefert.');
            }
            generated[kind] = createGeneratedDocument(kind, content, profile, job);
          } catch (error) {
            if (error instanceof AiError && error.code === 'aborted') break;
            failures.push(`${DOCUMENT_LABELS[kind]}: ${describeAiError(error)}`);
            if (
              error instanceof AiError &&
              (error.code === 'auth' || error.code === 'rate-limit' || error.code === 'config')
            ) {
              break;
            }
          }
        }

        if (token !== generationTokenRef.current) return;

        const completed = Object.keys(generated) as DocumentKind[];
        if (completed.length > 0) {
          addDocuments(generated);
          setActiveKind(completed[0]);
        }

        if (controller.signal.aborted) {
          show(
            'info',
            completed.length > 0
              ? 'Generierung abgebrochen. Bereits fertige Dokumente wurden übernommen.'
              : 'Generierung abgebrochen. Es wurden keine Dokumente übernommen.',
          );
          return;
        }

        if (failures.length > 0) {
          setGenerationErrors(failures);
          show(
            'error',
            failures.length === 1
              ? failures[0]
              : 'Einige Dokumente konnten nicht erstellt werden. Prüfe die Hinweise im Generator.',
          );
          return;
        }

        if (completed.length === kinds.length && completed.length > 0) {
          if (autoDelete) {
            clearInputs();
            setJobFetchState({ status: 'idle' });
            setJobAnalysisState({ status: 'idle' });
            show(
              'success',
              completed.length > 1
                ? 'Dokumente erstellt. Deine Eingaben wurden aus dem Arbeitsspeicher gelöscht.'
                : 'Dokument erstellt. Deine Eingaben wurden aus dem Arbeitsspeicher gelöscht.',
            );
          } else {
            show(
              'success',
              completed.length > 1
                ? 'Dokumente erstellt. Du kannst sie jetzt bearbeiten und exportieren.'
                : 'Dokument erstellt. Du kannst es jetzt bearbeiten und exportieren.',
            );
          }

          window.setTimeout(() => {
            document.getElementById('ergebnisse')?.scrollIntoView({
              behavior: prefersReducedMotion() ? 'auto' : 'smooth',
              block: 'start',
            });
          }, 80);
        }
      } finally {
        if (token === generationTokenRef.current) {
          setBusy(false);
          setStatusText(null);
          abortRef.current = null;
        }
      }
    },
    [
      provider,
      profile,
      resumeText,
      job,
      autoDelete,
      addDocuments,
      clearInputs,
      show,
    ],
  );

  const handleCancelGeneration = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const handleFetchJob = useCallback(async () => {
    const epoch = dataEpochRef.current;
    setJobFetchState({ status: 'loading' });

    try {
      const extraction = await fetchJobPage(job.url);
      if (epoch !== dataEpochRef.current) return;

      applyExtractedJob(extraction.text, extraction.company, extraction.role);
      setJobFetchState({
        status: 'success',
        message: `Stellenanzeige ausgelesen (${extraction.text.length.toLocaleString(
          'de-DE',
        )} Zeichen). Prüfe die Angaben und starte bei Bedarf die KI-Analyse.`,
      });
    } catch (error) {
      if (epoch !== dataEpochRef.current) return;
      setJobFetchState({
        status: 'error',
        message:
          error instanceof JobFetchError
            ? error.message
            : 'Die Stellenanzeige konnte nicht geladen werden. Füge den Text stattdessen ein.',
      });
    }
  }, [job.url, applyExtractedJob]);

  const handleAnalyzeJob = useCallback(async () => {
    if (!provider) {
      setJobAnalysisState({ status: 'error', message: 'Verbinde zuerst eine KI.' });
      return;
    }
    if (!job.text.trim()) {
      setJobAnalysisState({
        status: 'error',
        message: 'Füge zuerst die Stellenanzeige ein.',
      });
      return;
    }

    const epoch = dataEpochRef.current;
    setJobAnalysisState({ status: 'loading' });

    try {
      const client = createProvider(provider);
      const response = await client.complete(buildJobAnalysisRequest(job.text));
      if (epoch !== dataEpochRef.current) return;

      const analysis = parseJobAnalysis(response);
      const applied = applyJobAnalysis(analysis);
      setJobAnalysisState({
        status: 'success',
        message: applied
          ? 'Unternehmen, Rolle, Anforderungen und Aufgaben wurden übernommen. Bitte prüfen und bei Bedarf korrigieren.'
          : 'In der Anzeige wurden keine eindeutig zuordenbaren Angaben gefunden. Du kannst die Felder manuell ausfüllen.',
      });
    } catch (error) {
      if (epoch !== dataEpochRef.current) return;
      setJobAnalysisState({ status: 'error', message: describeAiError(error) });
    }
  }, [provider, job.text, applyJobAnalysis]);

  const handleConnect = useCallback(
    (config: ProviderConfig) => {
      connectProvider(config);
      show(
        'success',
        config.kind === 'openai'
          ? 'OpenAI API verbunden. Der Schlüssel bleibt nur im Arbeitsspeicher.'
          : 'Endpoint verbunden. Der Zugang bleibt nur im Arbeitsspeicher.',
      );
    },
    [connectProvider, show],
  );

  const handleDisconnect = useCallback(() => {
    disconnectProvider();
    show('info', 'KI-Verbindung getrennt. Der Schlüssel wurde aus dem Arbeitsspeicher entfernt.');
  }, [disconnectProvider, show]);

  const handleResumeParsed = useCallback(
    (text: string, fileName: string, pages: number, truncated: boolean) => {
      setResumeText(text, fileName, pages, truncated);
      show('success', 'Lebenslauf lokal ausgelesen. Die PDF-Datei wurde nicht hochgeladen.');
    },
    [setResumeText, show],
  );

  const availableDocuments = useMemo(
    () =>
      DOCUMENT_KINDS.map((kind) => documents[kind]).filter(
        (document): document is GeneratedDocument => Boolean(document),
      ),
    [documents],
  );

  const handleExportPdf = useCallback(
    async (kind: DocumentKind) => {
      const document = documents[kind];
      if (!document) return;
      try {
        // jsPDF is large; load it only when someone actually exports.
        const { exportDocumentAsPdf } = await import('./lib/exportDocuments');
        const pages = exportDocumentAsPdf(document);
        show('success', pages === 1 ? 'PDF mit einer Seite erstellt.' : `PDF mit ${pages} Seiten erstellt.`);
      } catch {
        show('error', 'Das PDF konnte nicht erstellt werden. Prüfe, ob das Dokument Text enthält.');
      }
    },
    [documents, show],
  );

  const handleExportTxt = useCallback(
    async (kind: DocumentKind) => {
      const document = documents[kind];
      if (!document) return;
      try {
        const { exportDocumentAsTxt } = await import('./lib/exportDocuments');
        exportDocumentAsTxt(document);
        show('success', 'TXT-Datei erstellt.');
      } catch {
        show('error', 'Die TXT-Datei konnte nicht erstellt werden.');
      }
    },
    [documents, show],
  );

  const handleExportAllTxt = useCallback(async () => {
    if (availableDocuments.length === 0) return;
    try {
      const { exportDocumentsAsTxt } = await import('./lib/exportDocuments');
      exportDocumentsAsTxt(availableDocuments);
      show('success', 'TXT-Datei mit allen Dokumenten erstellt.');
    } catch {
      show('error', 'Die TXT-Datei konnte nicht erstellt werden.');
    }
  }, [availableDocuments, show]);

  const handleConfirmWipe = useCallback(() => {
    dataEpochRef.current += 1;
    generationTokenRef.current += 1;
    abortRef.current?.abort();
    abortRef.current = null;

    setBusy(false);
    setStatusText(null);
    setGenerationErrors([]);
    setJobFetchState({ status: 'idle' });
    setJobAnalysisState({ status: 'idle' });
    setActiveKind(null);
    setUiResetKey((current) => current + 1);
    resetAll();
    setConfirmOpen(false);
    show('success', 'Alle Daten wurden aus dem Arbeitsspeicher entfernt.');
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  }, [resetAll, show]);

  const requestWipe = useCallback(() => setConfirmOpen(true), []);
  const cancelWipe = useCallback(() => setConfirmOpen(false), []);
  const handleActiveKindChange = useCallback((kind: DocumentKind | null) => {
    setActiveKind(kind);
  }, []);

  useEffect(() => {
    if (!hasInputs && !hasDocuments) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasInputs, hasDocuments]);

  const profileDone =
    Boolean(profile.firstName.trim() && profile.lastName.trim() && isValidEmail(profile.email)) &&
    Boolean(
      resumeText.trim() ||
        profile.experience.trim() ||
        profile.previousEmployers.trim() ||
        profile.skills.trim() ||
        profile.education.trim() ||
        profile.studies.trim(),
    );

  const jobDone =
    job.text.trim().length >= 80 ||
    Boolean(job.role.trim() && job.requirements.trim());

  return (
    <div id="top" className="min-h-screen">
      <TopBar onRequestWipe={requestWipe} />

      <main className="mx-auto w-full max-w-6xl px-5 pb-2 sm:px-8">
        <Hero />

        <Stepper
          profileDone={profileDone}
          jobDone={jobDone}
          aiDone={Boolean(provider)}
          exportDone={hasDocuments}
        />

        <div className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)]">
          <div className="space-y-6">
            <AiConnectionCard
              key={`ai-${uiResetKey}`}
              provider={provider}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
            />

            <ProfileCard profile={profile} onFieldChange={updateProfile} />

            <ResumeCard
              key={`resume-${uiResetKey}`}
              resumeText={resumeText}
              fileName={resume.fileName}
              pages={resume.pages}
              truncated={resume.truncated}
              onParsed={handleResumeParsed}
              onClear={clearResume}
            />

            <JobCard
              key={`job-${uiResetKey}`}
              job={job}
              onChange={updateJob}
              fetchState={jobFetchState}
              onFetch={handleFetchJob}
              aiConnected={Boolean(provider)}
              analysisState={jobAnalysisState}
              onAnalyze={handleAnalyzeJob}
            />
          </div>

          <div className="space-y-6">
            <GenerateCard
              connected={Boolean(provider)}
              autoDelete={autoDelete}
              onAutoDeleteChange={setAutoDelete}
              onGenerate={handleGenerate}
              busy={busy}
              statusText={statusText}
              onCancel={handleCancelGeneration}
              errors={generationErrors}
            />

            <ResultsCard
              documents={documents}
              activeKind={activeKind}
              onActiveKindChange={handleActiveKindChange}
              onContentChange={updateDocumentContent}
              onExportPdf={handleExportPdf}
              onExportTxt={handleExportTxt}
              onExportAllTxt={handleExportAllTxt}
            />
          </div>
        </div>

        <PrivacySection autoDelete={autoDelete} onRequestWipe={requestWipe} />
      </main>

      <Footer />

      {notice ? <NotificationBar notice={notice} onDismiss={dismiss} /> : null}

      <ConfirmDialog open={confirmOpen} onCancel={cancelWipe} onConfirm={handleConfirmWipe} />
    </div>
  );
}
