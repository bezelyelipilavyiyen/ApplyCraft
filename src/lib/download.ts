import type { GeneratedDocument } from './types';
import { DOCUMENT_FILE_LABELS } from './types';
import { safeFilenamePart } from './utils';

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function buildFileName(document: GeneratedDocument, extension: 'pdf' | 'txt'): string {
  const lastNames = document.meta.name.trim().split(/\s+/).filter(Boolean);
  const lastName = lastNames.length > 0 ? lastNames[lastNames.length - 1] : '';
  const target = document.company || document.role;
  const parts = [
    DOCUMENT_FILE_LABELS[document.kind],
    safeFilenamePart(target),
    safeFilenamePart(lastName),
  ].filter(Boolean);

  const base = (parts.join('_') || 'Bewerbung').slice(0, 120);
  return `${base}.${extension}`;
}
