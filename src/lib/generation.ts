import type { AiRequest } from './ai/types';
import {
  buildCoverLetterRequest,
  buildEmailRequest,
  buildResumeRequest,
} from './ai/prompts';
import type {
  ApplicantMeta,
  DocumentKind,
  GeneratedDocument,
  JobPosting,
  PersonalProfile,
} from './types';

export function createApplicantMeta(profile: PersonalProfile): ApplicantMeta {
  return {
    name: [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim(),
    email: profile.email.trim(),
    phone: profile.phone.trim(),
    address: profile.address.trim(),
    postalCode: profile.postalCode.trim(),
    city: profile.city.trim(),
  };
}

export function buildRequestForKind(
  kind: DocumentKind,
  profile: PersonalProfile,
  resumeText: string,
  job: JobPosting,
): AiRequest {
  if (kind === 'coverLetter') return buildCoverLetterRequest(profile, resumeText, job);
  if (kind === 'resume') return buildResumeRequest(profile, resumeText, job);
  return buildEmailRequest(profile, resumeText, job);
}

export function createGeneratedDocument(
  kind: DocumentKind,
  content: string,
  profile: PersonalProfile,
  job: JobPosting,
): GeneratedDocument {
  return {
    kind,
    content,
    meta: createApplicantMeta(profile),
    company: job.company.trim(),
    role: job.role.trim(),
    generatedAt: Date.now(),
  };
}
