import type { JobPosting, PersonalProfile } from './types';
import { isValidEmail } from './utils';

export function hasJobContext(job: JobPosting): boolean {
  return (
    job.text.trim().length >= 80 ||
    (job.role.trim().length > 1 && job.requirements.trim().length > 0)
  );
}

export function validateGeneration(
  profile: PersonalProfile,
  resumeText: string,
  job: JobPosting,
): string[] {
  const issues: string[] = [];

  if (!profile.firstName.trim()) issues.push('Vorname fehlt.');
  if (!profile.lastName.trim()) issues.push('Nachname fehlt.');

  if (!profile.email.trim()) {
    issues.push('E-Mail-Adresse fehlt.');
  } else if (!isValidEmail(profile.email)) {
    issues.push('Die E-Mail-Adresse ist ungültig.');
  }

  const hasSubstance =
    Boolean(resumeText.trim()) ||
    profile.experience.trim().length > 0 ||
    profile.previousEmployers.trim().length > 0 ||
    profile.skills.trim().length > 0 ||
    profile.education.trim().length > 0 ||
    profile.studies.trim().length > 0;

  if (!hasSubstance) {
    issues.push(
      'Trage Berufserfahrung, Fähigkeiten oder deinen Lebenslauf ein, damit die KI nichts erfinden muss.',
    );
  }

  if (!hasJobContext(job)) {
    issues.push(
      'Füge die Stellenanzeige ein oder trage Stellenbezeichnung und Anforderungen ein.',
    );
  }

  return issues;
}
