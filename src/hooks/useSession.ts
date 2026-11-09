import { useCallback, useMemo, useState } from 'react';
import type { JobAnalysis } from '../lib/ai/jobAnalysis';
import type {
  DocumentKind,
  DocumentSet,
  GeneratedDocument,
  JobPosting,
  PersonalProfile,
  ProviderConfig,
} from '../lib/types';
import {
  EMPTY_JOB,
  EMPTY_PROFILE,
  JOB_LIMITS,
  LONG_PROFILE_FIELDS,
  PROFILE_LIMITS,
} from '../lib/types';

export type EditableJobField = Exclude<keyof JobPosting, 'source'>;

export interface ResumeState {
  text: string;
  fileName: string;
  pages: number | null;
  truncated: boolean;
}

const EMPTY_RESUME: ResumeState = {
  text: '',
  fileName: '',
  pages: null,
  truncated: false,
};

const LONG_JOB_FIELDS: ReadonlySet<EditableJobField> = new Set([
  'text',
  'requirements',
  'tasks',
]);

function sanitizeInput(value: string, maxLength: number, singleLine: boolean): string {
  const cleaned = value
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
  const shaped = singleLine ? cleaned.replace(/\n+/g, ' ') : cleaned;
  return shaped.slice(0, maxLength);
}

export function useSession() {
  const [profile, setProfile] = useState<PersonalProfile>({ ...EMPTY_PROFILE });
  const [job, setJob] = useState<JobPosting>({ ...EMPTY_JOB });
  const [resume, setResume] = useState<ResumeState>({ ...EMPTY_RESUME });
  const [documents, setDocuments] = useState<DocumentSet>({});
  const [provider, setProvider] = useState<ProviderConfig | null>(null);
  const [autoDelete, setAutoDeleteState] = useState(true);

  const updateProfile = useCallback((field: keyof PersonalProfile, value: string) => {
    const sanitized = sanitizeInput(
      value,
      PROFILE_LIMITS[field],
      !LONG_PROFILE_FIELDS.has(field),
    );
    setProfile((current) => ({ ...current, [field]: sanitized }));
  }, []);

  const updateJob = useCallback((field: EditableJobField, value: string) => {
    const sanitized = sanitizeInput(value, JOB_LIMITS[field], !LONG_JOB_FIELDS.has(field));
    setJob((current) => ({ ...current, [field]: sanitized }));
  }, []);

  const setResumeText = useCallback(
    (text: string, fileName: string, pages: number | null, truncated: boolean) => {
      setResume({
        text: text.slice(0, 50000),
        fileName: sanitizeInput(fileName, 160, true),
        pages,
        truncated,
      });
    },
    [],
  );

  const clearResume = useCallback(() => {
    setResume({ ...EMPTY_RESUME });
  }, []);

  const applyExtractedJob = useCallback((text: string, company: string, role: string) => {
    setJob((current) => ({
      ...current,
      text: sanitizeInput(text, JOB_LIMITS.text, false),
      company: company ? sanitizeInput(company, JOB_LIMITS.company, true) : current.company,
      role: role ? sanitizeInput(role, JOB_LIMITS.role, true) : current.role,
      source: 'url',
    }));
  }, []);

  const applyJobAnalysis = useCallback(
    (analysis: JobAnalysis): boolean => {
      const applied = Boolean(
        analysis.company ||
          analysis.role ||
          analysis.requirements.length > 0 ||
          analysis.tasks.length > 0,
      );
      if (!applied) return false;

      setJob((current) => ({
        ...current,
        company: analysis.company || current.company,
        role: analysis.role || current.role,
        requirements:
          analysis.requirements.length > 0
            ? analysis.requirements.join('\n')
            : current.requirements,
        tasks: analysis.tasks.length > 0 ? analysis.tasks.join('\n') : current.tasks,
      }));
      return true;
    },
    [],
  );

  const connectProvider = useCallback((config: ProviderConfig) => {
    setProvider({
      kind: config.kind,
      apiKey: config.apiKey.trim(),
      model: config.model.trim(),
      baseUrl: config.baseUrl.trim(),
    });
  }, []);

  const disconnectProvider = useCallback(() => {
    setProvider(null);
  }, []);

  const setAutoDelete = useCallback((value: boolean) => {
    setAutoDeleteState(value);
  }, []);

  const addDocuments = useCallback((next: DocumentSet) => {
    setDocuments((current) => ({ ...current, ...next }));
  }, []);

  const updateDocumentContent = useCallback((kind: DocumentKind, content: string) => {
    setDocuments((current) => {
      const document = current[kind];
      if (!document) return current;
      return {
        ...current,
        [kind]: {
          ...document,
          content: sanitizeInput(content, 30000, false),
        },
      };
    });
  }, []);

  const clearInputs = useCallback(() => {
    setProfile({ ...EMPTY_PROFILE });
    setJob({ ...EMPTY_JOB });
    setResume({ ...EMPTY_RESUME });
  }, []);

  const resetAll = useCallback(() => {
    setProfile({ ...EMPTY_PROFILE });
    setJob({ ...EMPTY_JOB });
    setResume({ ...EMPTY_RESUME });
    setDocuments({});
    setProvider(null);
    setAutoDeleteState(true);
  }, []);

  const hasInputs = useMemo(() => {
    const profileHasValue = (Object.keys(profile) as Array<keyof PersonalProfile>).some(
      (field) => profile[field].trim().length > 0,
    );
    const jobHasValue =
      job.url.trim().length > 0 ||
      job.text.trim().length > 0 ||
      job.company.trim().length > 0 ||
      job.role.trim().length > 0 ||
      job.requirements.trim().length > 0 ||
      job.tasks.trim().length > 0;
    return profileHasValue || jobHasValue || resume.text.trim().length > 0;
  }, [profile, job, resume.text]);

  const hasDocuments = useMemo(
    () => Object.keys(documents).length > 0,
    [documents],
  );

  return {
    profile,
    job,
    resume,
    resumeText: resume.text,
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
  };
}

export type SessionApi = ReturnType<typeof useSession>;

export type DocumentUpdater = (document: GeneratedDocument) => void;
