export const DOCUMENT_KINDS = ['coverLetter', 'resume', 'email'] as const;

export type DocumentKind = (typeof DOCUMENT_KINDS)[number];

export const DOCUMENT_LABELS: Record<DocumentKind, string> = {
  coverLetter: 'Anschreiben',
  resume: 'Lebenslauf',
  email: 'Bewerbungs-E-Mail',
};

export const DOCUMENT_FILE_LABELS: Record<DocumentKind, string> = {
  coverLetter: 'Anschreiben',
  resume: 'Lebenslauf',
  email: 'Bewerbungs-E-Mail',
};

export interface PersonalProfile {
  firstName: string;
  lastName: string;
  address: string;
  postalCode: string;
  city: string;
  email: string;
  phone: string;
  currentRole: string;
  experience: string;
  previousEmployers: string;
  education: string;
  studies: string;
  skills: string;
  languages: string;
  extraQualifications: string;
}

export const EMPTY_PROFILE: PersonalProfile = {
  firstName: '',
  lastName: '',
  address: '',
  postalCode: '',
  city: '',
  email: '',
  phone: '',
  currentRole: '',
  experience: '',
  previousEmployers: '',
  education: '',
  studies: '',
  skills: '',
  languages: '',
  extraQualifications: '',
};

export const PROFILE_LIMITS: Record<keyof PersonalProfile, number> = {
  firstName: 80,
  lastName: 80,
  address: 160,
  postalCode: 16,
  city: 80,
  email: 254,
  phone: 40,
  currentRole: 120,
  experience: 2500,
  previousEmployers: 2000,
  education: 1600,
  studies: 1600,
  skills: 1600,
  languages: 800,
  extraQualifications: 1600,
};

export const LONG_PROFILE_FIELDS: ReadonlySet<keyof PersonalProfile> = new Set([
  'experience',
  'previousEmployers',
  'education',
  'studies',
  'skills',
  'languages',
  'extraQualifications',
]);

export type JobSource = 'url' | 'text' | null;

export interface JobPosting {
  url: string;
  text: string;
  company: string;
  role: string;
  requirements: string;
  tasks: string;
  source: JobSource;
}

export const EMPTY_JOB: JobPosting = {
  url: '',
  text: '',
  company: '',
  role: '',
  requirements: '',
  tasks: '',
  source: null,
};

export const JOB_LIMITS = {
  url: 2048,
  text: 30000,
  company: 200,
  role: 200,
  requirements: 4000,
  tasks: 4000,
} as const;

export interface ApplicantMeta {
  name: string;
  email: string;
  phone: string;
  address: string;
  postalCode: string;
  city: string;
}

export interface GeneratedDocument {
  kind: DocumentKind;
  content: string;
  meta: ApplicantMeta;
  company: string;
  role: string;
  generatedAt: number;
}

export type DocumentSet = Partial<Record<DocumentKind, GeneratedDocument>>;

export type ProviderKind = 'openai' | 'endpoint';

export interface ProviderConfig {
  kind: ProviderKind;
  apiKey: string;
  model: string;
  baseUrl: string;
}

export const OPENAI_BASE_URL = 'https://api.openai.com/v1';
export const DEFAULT_OPENAI_MODEL = 'gpt-4.1-mini';
export const SUGGESTED_MODELS = ['gpt-4.1-mini', 'gpt-4.1', 'gpt-4o-mini', 'gpt-4o'] as const;
