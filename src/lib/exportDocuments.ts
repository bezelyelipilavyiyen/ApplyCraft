import { buildFileName, downloadBlob } from './download';
import { buildPdf } from './pdf/buildPdf';
import type { GeneratedDocument } from './types';
import { DOCUMENT_KINDS, DOCUMENT_LABELS } from './types';

function letterhead(document: GeneratedDocument): string {
  const address = [
    document.meta.address,
    [document.meta.postalCode, document.meta.city].filter(Boolean).join(' '),
  ]
    .filter(Boolean)
    .join(', ');
  const contact = [document.meta.email, document.meta.phone].filter(Boolean).join(' · ');

  return [document.meta.name, address, contact].filter(Boolean).join('\n');
}

function txtPayload(document: GeneratedDocument): string {
  const label = DOCUMENT_LABELS[document.kind];
  return `${label.toLocaleUpperCase('de-DE')}\n${'='.repeat(label.length)}\n\n${letterhead(
    document,
  )}\n\n${document.content}\n`;
}

export function exportDocumentAsPdf(document: GeneratedDocument): number {
  const { blob, pages } = buildPdf(document);
  downloadBlob(blob, buildFileName(document, 'pdf'));
  return pages;
}

export function exportDocumentAsTxt(document: GeneratedDocument): void {
  const blob = new Blob([txtPayload(document)], { type: 'text/plain;charset=utf-8' });
  downloadBlob(blob, buildFileName(document, 'txt'));
}

export function exportDocumentsAsTxt(documents: GeneratedDocument[]): void {
  if (documents.length === 0) return;
  const sorted = DOCUMENT_KINDS.map((kind) =>
    documents.find((document) => document.kind === kind),
  ).filter((document): document is GeneratedDocument => Boolean(document));

  const divider = `\n\n${'='.repeat(64)}\n\n`;
  const blob = new Blob([sorted.map(txtPayload).join(divider)], {
    type: 'text/plain;charset=utf-8',
  });
  downloadBlob(blob, 'ApplyCraft_Bewerbungsunterlagen.txt');
}
