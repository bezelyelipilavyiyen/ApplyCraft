import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf.mjs';
import pdfWorkerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';
import { sanitizeText } from '../utils';
import { ResumeParseError } from './errors';

GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export interface PdfTextResult {
  text: string;
  pages: number;
  truncated: boolean;
}

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_PAGES = 15;
const MAX_CHARS = 50_000;

export async function extractResumeText(file: File): Promise<PdfTextResult> {
  if (file.size > MAX_FILE_BYTES) {
    throw new ResumeParseError('size', 'Die Datei ist größer als 10 MB. Bitte wähle ein kleineres PDF.');
  }
  if (!file.name.toLowerCase().endsWith('.pdf') && !file.type.includes('pdf')) {
    throw new ResumeParseError('type', 'Bitte wähle eine PDF-Datei aus.');
  }

  let buffer: ArrayBuffer;
  try {
    buffer = await file.arrayBuffer();
  } catch {
    throw new ResumeParseError('corrupt', 'Die Datei konnte nicht gelesen werden.');
  }

  // Text extraction is local: the PDF never leaves the browser.
  const loadingTask = getDocument({
    data: new Uint8Array(buffer),
    disableFontFace: true,
    useSystemFonts: false,
  });

  try {
    const pdf = await loadingTask.promise;
    const pageLimit = Math.min(pdf.numPages, MAX_PAGES);
    const pageTexts: string[] = [];

    for (let pageNumber = 1; pageNumber <= pageLimit; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      pageTexts.push(textFromItems(content.items));
      page.cleanup();
    }

    const text = sanitizeText(normalizePdfText(pageTexts.join('\n\n')), MAX_CHARS);
    if (text.length < 120) {
      throw new ResumeParseError(
        'empty',
        'In diesem PDF wurde kein auslesbarer Text gefunden. Bei einem Scan trage deine Angaben bitte manuell ein.',
      );
    }

    return {
      text,
      pages: pdf.numPages,
      truncated: pdf.numPages > pageLimit,
    };
  } catch (error) {
    if (error instanceof ResumeParseError) throw error;
    const name = error instanceof Error ? error.name : '';
    if (name === 'PasswordException') {
      throw new ResumeParseError(
        'password',
        'Dieses PDF ist passwortgeschützt. Bitte entferne den Schutz oder trage deine Angaben manuell ein.',
      );
    }
    throw new ResumeParseError(
      'corrupt',
      'Die PDF-Datei konnte nicht gelesen werden. Möglicherweise ist sie beschädigt.',
    );
  } finally {
    try {
      await loadingTask.destroy();
    } catch {
      // Cleanup failure does not affect the extracted result.
    }
  }
}

function textFromItems(items: ReadonlyArray<unknown>): string {
  let result = '';
  let lastY: number | null = null;

  for (const item of items) {
    if (!item || typeof item !== 'object') continue;
    const fragment = item as { str?: unknown; transform?: unknown; hasEOL?: unknown };
    if (typeof fragment.str !== 'string') continue;
    const transform = Array.isArray(fragment.transform) ? fragment.transform : null;
    const y = transform && typeof transform[5] === 'number' ? transform[5] : null;

    if (lastY !== null && y !== null && Math.abs(y - lastY) > 2.5) {
      result += '\n';
    } else if (result && !result.endsWith('\n') && !result.endsWith(' ')) {
      result += ' ';
    }

    result += fragment.str;
    lastY = y;

    if (fragment.hasEOL === true) {
      result += '\n';
      lastY = null;
    }
  }

  return result;
}

function normalizePdfText(value: string): string {
  return value
    .replace(/\u00AD/g, '')
    .replace(/\r\n?/g, '\n')
    .replace(/([a-zäöüß])-\n([a-zäöüß])/gi, '$1$2')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}
