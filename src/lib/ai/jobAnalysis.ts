import { sanitizeLine } from '../utils';
import { AiError } from './types';

export interface JobAnalysis {
  company: string;
  role: string;
  requirements: string[];
  tasks: string[];
}

const EMPTY_VALUES = new Set(['', '-', 'n/a', 'na', 'unbekannt', 'keine angabe', 'none', 'null']);

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function cleanValue(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return '';
  const cleaned = sanitizeLine(value, maxLength);
  return EMPTY_VALUES.has(cleaned.toLowerCase()) ? '' : cleaned;
}

function cleanList(value: unknown, maxItems: number, maxLength: number): string[] {
  const source = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split('\n')
      : [];
  const seen = new Set<string>();
  const result: string[] = [];

  for (const entry of source) {
    if (typeof entry !== 'string') continue;
    const cleaned = sanitizeLine(entry, maxLength);
    if (!cleaned) continue;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(cleaned);
    if (result.length >= maxItems) break;
  }
  return result;
}

export function parseJobAnalysis(raw: string): JobAnalysis {
  const cleaned = raw
    .replace(/```(?:json)?/gi, '')
    .replace(/```/g, '')
    .trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end <= start) {
    throw new AiError(
      'bad-response',
      'Die KI-Antwort enthielt kein lesbares JSON. Bitte versuche die Analyse erneut.',
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    throw new AiError(
      'bad-response',
      'Die KI-Antwort konnte nicht gelesen werden. Bitte versuche die Analyse erneut.',
    );
  }

  const object = asRecord(parsed);
  if (!object) {
    throw new AiError('bad-response', 'Die KI-Antwort hatte ein unerwartetes Format.');
  }

  return {
    company: cleanValue(object.company, 200),
    role: cleanValue(object.role, 200),
    requirements: cleanList(object.requirements, 10, 400),
    tasks: cleanList(object.tasks, 8, 400),
  };
}
