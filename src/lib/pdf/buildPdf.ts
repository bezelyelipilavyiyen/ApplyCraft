import { jsPDF } from 'jspdf';
import type { GeneratedDocument } from '../types';
import { DOCUMENT_LABELS } from '../types';
import { toWinAnsiSafe } from '../utils';

export interface BuiltPdf {
  blob: Blob;
  pages: number;
}

const PAGE_WIDTH = 210;
const MARGIN_X = 20;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;
const CONTENT_BOTTOM = 268;
const BODY_SIZE = 10.5;
const BODY_LINE_HEIGHT = 5.15;
const ACCENT: [number, number, number] = [176, 139, 82];
const INK: [number, number, number] = [24, 26, 28];
const MUTED: [number, number, number] = [100, 104, 108];
const RULE: [number, number, number] = [220, 218, 212];

const SECTION_KEYWORDS = new Set([
  'profil',
  'berufserfahrung',
  'beruflicher werdegang',
  'ausbildung',
  'studium',
  'bildung',
  'fähigkeiten',
  'kenntnisse',
  'it-kenntnisse',
  'sprachen',
  'sprachkenntnisse',
  'weitere qualifikationen',
  'zertifikate',
  'projekte',
  'zusammenfassung',
  'kontakt',
  'persönliche daten',
  'interessen',
  'soft skills',
]);

type BlockType = 'heading' | 'paragraph' | 'list' | 'entry';

interface Block {
  type: BlockType;
  lines: string[];
}

export function buildPdf(document: GeneratedDocument): BuiltPdf {
  const label = DOCUMENT_LABELS[document.kind];
  const content = document.content.trim();
  if (!content) {
    throw new Error('Das Dokument enthält keinen Text.');
  }

  const blocks = parseBlocks(content);
  if (blocks.length === 0) {
    throw new Error('Das Dokument enthält keinen darstellbaren Text.');
  }

  const pdf = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  pdf.setProperties({
    title: label,
    creator: 'ApplyCraft',
    subject: label,
  });

  let y = drawFirstPageHeader(pdf, document, label);

  const wrap = (text: string, width: number): string[] => {
    const wrapped = pdf.splitTextToSize(text, width);
    return Array.isArray(wrapped) ? (wrapped as string[]) : [String(wrapped)];
  };

  const startNewPage = (): void => {
    pdf.addPage();
    y = drawRunningHeader(pdf, document, label);
  };

  const ensureSpace = (height: number): void => {
    if (y + height > CONTENT_BOTTOM) startNewPage();
  };

  const setBodyFont = (bold = false): void => {
    pdf.setFont('helvetica', bold ? 'bold' : 'normal');
    pdf.setFontSize(bold ? 10.8 : BODY_SIZE);
    pdf.setTextColor(INK[0], INK[1], INK[2]);
  };

  const drawBodyLine = (text: string, bold: boolean): void => {
    if (!text.trim()) return;
    const segments = wrap(toWinAnsiSafe(text), CONTENT_WIDTH);
    setBodyFont(bold);
    for (const segment of segments) {
      ensureSpace(BODY_LINE_HEIGHT + 0.6);
      pdf.text(segment, MARGIN_X, y);
      y += BODY_LINE_HEIGHT;
    }
  };

  const drawBullet = (line: string): void => {
    const text = line.replace(/^[-*•–—]\s+/, '').replace(/^\d+[.)]\s+/, '').trim();
    if (!text) return;
    const segments = wrap(toWinAnsiSafe(text), CONTENT_WIDTH - 5);
    setBodyFont(false);
    for (let index = 0; index < segments.length; index += 1) {
      ensureSpace(BODY_LINE_HEIGHT + 0.6);
      setBodyFont(false);
      if (index === 0) {
        pdf.setFillColor(ACCENT[0], ACCENT[1], ACCENT[2]);
        pdf.circle(MARGIN_X + 1.3, y - 1.15, 0.65, 'F');
      }
      pdf.text(segments[index], MARGIN_X + 5, y);
      y += BODY_LINE_HEIGHT;
    }
  };

  const drawHeading = (text: string): void => {
    if (y > 50) y += 3.5;
    ensureSpace(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10.3);
    pdf.setTextColor(INK[0], INK[1], INK[2]);
    pdf.text(toWinAnsiSafe(text.toLocaleUpperCase('de-DE')), MARGIN_X, y);
    pdf.setDrawColor(ACCENT[0], ACCENT[1], ACCENT[2]);
    pdf.setLineWidth(0.35);
    pdf.line(MARGIN_X, y + 2, MARGIN_X + 12, y + 2);
    y += 8.2;
  };

  const drawEntry = (lines: string[]): void => {
    const header = lines[0] ?? '';
    const tail = lines.slice(1);
    if (!header.trim()) return;

    const headerSegments = wrap(toWinAnsiSafe(header), CONTENT_WIDTH);
    if (y + headerSegments.length * 5.6 + 14 > CONTENT_BOTTOM) startNewPage();

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10.8);
    pdf.setTextColor(INK[0], INK[1], INK[2]);
    for (const segment of headerSegments) {
      pdf.text(segment, MARGIN_X, y);
      y += 5.6;
    }
    y += 0.8;

    for (const line of tail) {
      if (isBulletLine(line)) {
        drawBullet(line);
      } else {
        drawBodyLine(line, false);
      }
    }
    y += 2.4;
  };

  for (const block of blocks) {
    if (block.type === 'heading') {
      drawHeading(block.lines[0] ?? '');
    } else if (block.type === 'list') {
      ensureSpace(12);
      for (const line of block.lines) {
        if (isBulletLine(line)) drawBullet(line);
        else drawBodyLine(line, false);
      }
      y += 2.4;
    } else if (block.type === 'entry') {
      drawEntry(block.lines);
    } else {
      for (const line of block.lines) drawBodyLine(line, false);
      y += 2.4;
    }
  }

  drawFooters(pdf, label);
  const pages = pdf.getNumberOfPages();
  return { blob: pdf.output('blob'), pages };
}

function drawFirstPageHeader(
  pdf: jsPDF,
  document: GeneratedDocument,
  label: string,
): number {
  pdf.setFillColor(ACCENT[0], ACCENT[1], ACCENT[2]);
  pdf.rect(0, 0, PAGE_WIDTH, 2.3, 'F');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  pdf.setTextColor(ACCENT[0], ACCENT[1], ACCENT[2]);
  pdf.setCharSpace(0.75);
  pdf.text(label.toLocaleUpperCase('de-DE'), MARGIN_X, 20);
  pdf.setCharSpace(0);

  const name = document.meta.name.trim() || 'Bewerbung';
  pdf.setFontSize(21);
  pdf.setTextColor(INK[0], INK[1], INK[2]);
  pdf.text(toWinAnsiSafe(name), MARGIN_X, 30);

  const address = [
    document.meta.address,
    [document.meta.postalCode, document.meta.city].filter(Boolean).join(' '),
  ]
    .filter(Boolean)
    .join(', ');
  const contact = [document.meta.email, document.meta.phone].filter(Boolean).join('  ·  ');

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.8);
  pdf.setTextColor(MUTED[0], MUTED[1], MUTED[2]);

  let infoY = 36.5;
  for (const value of [address, contact]) {
    if (!value) continue;
    const wrapped = pdf.splitTextToSize(toWinAnsiSafe(value), CONTENT_WIDTH) as string[];
    for (const line of wrapped) {
      pdf.text(line, MARGIN_X, infoY);
      infoY += 4.2;
    }
  }

  const ruleY = Math.max(infoY + 1.2, 44);
  pdf.setDrawColor(RULE[0], RULE[1], RULE[2]);
  pdf.setLineWidth(0.3);
  pdf.line(MARGIN_X, ruleY, PAGE_WIDTH - MARGIN_X, ruleY);
  return ruleY + 8.5;
}

function drawRunningHeader(
  pdf: jsPDF,
  document: GeneratedDocument,
  label: string,
): number {
  pdf.setFillColor(ACCENT[0], ACCENT[1], ACCENT[2]);
  pdf.rect(0, 0, PAGE_WIDTH, 1.4, 'F');

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.6);
  pdf.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
  const header = [document.meta.name.trim(), label].filter(Boolean).join('  ·  ');
  pdf.text(toWinAnsiSafe(header), MARGIN_X, 15);

  pdf.setDrawColor(RULE[0], RULE[1], RULE[2]);
  pdf.setLineWidth(0.25);
  pdf.line(MARGIN_X, 18.5, PAGE_WIDTH - MARGIN_X, 18.5);
  return 28;
}

function drawFooters(pdf: jsPDF, label: string): void {
  const total = pdf.getNumberOfPages();
  for (let page = 1; page <= total; page += 1) {
    pdf.setPage(page);
    pdf.setDrawColor(RULE[0], RULE[1], RULE[2]);
    pdf.setLineWidth(0.25);
    pdf.line(MARGIN_X, 283.5, PAGE_WIDTH - MARGIN_X, 283.5);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.3);
    pdf.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    pdf.text(label, MARGIN_X, 288);
    pdf.text(`${page} / ${total}`, PAGE_WIDTH - MARGIN_X, 288, { align: 'right' });
  }
}

function normalizeLine(line: string): string {
  return line
    .replace(/^#{1,6}\s+/, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\s+$/, '')
    .trim();
}

function isBulletLine(line: string): boolean {
  return /^([-*•–—]|\d+[.)])\s+/.test(line);
}

function isHeadingLine(line: string): boolean {
  const clean = line.replace(/[.:]+$/, '').trim();
  if (clean.length < 3 || clean.length > 64) return false;
  if (/[.!?]$/.test(clean)) return false;

  const upper = clean === clean.toLocaleUpperCase('de-DE') && /[A-ZÄÖÜ]/.test(clean);
  if (upper && clean.split(/\s+/).length <= 7) return true;

  return SECTION_KEYWORDS.has(clean.toLocaleLowerCase('de-DE'));
}

function parseBlocks(content: string): Block[] {
  const lines = content.replace(/\r\n?/g, '\n').split('\n').map(normalizeLine);
  const groups: string[][] = [];
  let current: string[] = [];

  for (const line of lines) {
    if (!line) {
      if (current.length > 0) {
        groups.push(current);
        current = [];
      }
    } else {
      current.push(line);
    }
  }
  if (current.length > 0) groups.push(current);

  const blocks: Block[] = [];

  for (const group of groups) {
    if (group.length === 1) {
      blocks.push({
        type: isHeadingLine(group[0]) ? 'heading' : 'paragraph',
        lines: group,
      });
      continue;
    }

    if (group.every(isBulletLine) || isBulletLine(group[0])) {
      blocks.push({ type: 'list', lines: group });
      continue;
    }

    if (group.slice(1).some(isBulletLine)) {
      blocks.push({ type: 'entry', lines: group });
      continue;
    }

    blocks.push({ type: 'paragraph', lines: group });
  }

  return blocks;
}
