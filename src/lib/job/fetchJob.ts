import { sanitizeLine, sanitizeText } from '../utils';

export type JobFetchFailure =
  | 'invalid-url'
  | 'network'
  | 'http'
  | 'unsupported'
  | 'empty'
  | 'timeout';

export class JobFetchError extends Error {
  readonly reason: JobFetchFailure;
  readonly status?: number;

  constructor(reason: JobFetchFailure, message: string, status?: number) {
    super(message);
    this.name = 'JobFetchError';
    this.reason = reason;
    this.status = status;
  }
}

export interface JobPageExtraction {
  text: string;
  company: string;
  role: string;
}

const MAX_HTML_CHARS = 2_500_000;
const MAX_TEXT_CHARS = 30_000;
const MIN_TEXT_CHARS = 120;

const BLOCK_TAGS = new Set([
  'ADDRESS',
  'ARTICLE',
  'ASIDE',
  'BLOCKQUOTE',
  'BR',
  'DD',
  'DIV',
  'DL',
  'DT',
  'FIELDSET',
  'FIGCAPTION',
  'FIGURE',
  'FOOTER',
  'FORM',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'HEADER',
  'LI',
  'MAIN',
  'NAV',
  'OL',
  'P',
  'PRE',
  'SECTION',
  'TABLE',
  'TD',
  'TH',
  'TR',
  'UL',
]);

export async function fetchJobPage(urlValue: string): Promise<JobPageExtraction> {
  const trimmed = urlValue.trim();
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new JobFetchError('invalid-url', 'Die URL ist ungültig. Beispiel: https://firma.de/jobs/123');
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new JobFetchError('invalid-url', 'Bitte verwende eine http(s)-URL.');
  }
  if (!url.hostname) {
    throw new JobFetchError('invalid-url', 'Die URL enthält keinen Host.');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      signal: controller.signal,
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      headers: { Accept: 'text/html,application/xhtml+xml,text/plain;q=0.8' },
      redirect: 'follow',
    });

    if (!response.ok) {
      throw new JobFetchError(
        'http',
        `Die Seite hat mit HTTP ${response.status} geantwortet. Füge den Text der Anzeige stattdessen ein.`,
        response.status,
      );
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (contentType && !/text\/html|application\/xhtml\+xml|text\/plain/i.test(contentType)) {
      throw new JobFetchError(
        'unsupported',
        'Der Link führt nicht zu einer lesbaren HTML-Seite. Füge den Text der Anzeige stattdessen ein.',
      );
    }

    const declaredLength = Number(response.headers.get('content-length'));
    if (Number.isFinite(declaredLength) && declaredLength > MAX_HTML_CHARS) {
      throw new JobFetchError(
        'unsupported',
        'Die Seite ist zu groß, um sie im Browser zu analysieren. Füge den Text der Anzeige stattdessen ein.',
      );
    }

    const html = (await response.text()).slice(0, MAX_HTML_CHARS);
    if (!html.trim()) {
      throw new JobFetchError(
        'empty',
        'Die Seite enthielt keinen lesbaren Inhalt. Füge den Text der Anzeige stattdessen ein.',
      );
    }

    const extraction = parseJobPage(html);
    if (extraction.text.length < MIN_TEXT_CHARS) {
      throw new JobFetchError(
        'empty',
        'Auf der Seite wurde zu wenig Text gefunden (möglicherweise nur ein Cookie-Hinweis). Füge den Text der Anzeige stattdessen ein.',
      );
    }
    return extraction;
  } catch (error) {
    if (error instanceof JobFetchError) throw error;
    if (controller.signal.aborted) {
      throw new JobFetchError(
        'timeout',
        'Die Seite hat zu lange gebraucht. Füge den Text der Anzeige stattdessen ein.',
      );
    }
    throw new JobFetchError(
      'network',
      'Der Browser konnte die Seite nicht direkt laden. Viele Jobportale blockieren das (CORS). Füge den Text der Anzeige stattdessen ein.',
    );
  } finally {
    clearTimeout(timeout);
  }
}

function parseJobPage(html: string): JobPageExtraction {
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  const posting = findJobPosting(parsed);

  let company = '';
  let role = '';
  let structuredText = '';

  if (posting) {
    company = readOrganizationName(posting.hiringOrganization);
    if (typeof posting.title === 'string') {
      role = sanitizeLine(posting.title, 200);
    }
    if (typeof posting.description === 'string') {
      const descriptionDocument = new DOMParser().parseFromString(posting.description, 'text/html');
      structuredText = normalizeExtractedText(visibleText(descriptionDocument.body));
    }
  }

  const mainText = extractMainText(parsed);
  const chosen = structuredText.length > Math.max(mainText.length, 200) ? structuredText : mainText;

  return {
    text: sanitizeText(normalizeExtractedText(chosen), MAX_TEXT_CHARS),
    company: sanitizeLine(company, 200),
    role,
  };
}

function findJobPosting(document: Document): Record<string, unknown> | null {
  const scripts = document.querySelectorAll('script[type="application/ld+json"]');

  for (const script of Array.from(scripts)) {
    const raw = script.textContent;
    if (!raw) continue;

    try {
      const parsed: unknown = JSON.parse(raw);
      const queue: unknown[] = Array.isArray(parsed) ? [...parsed] : [parsed];

      while (queue.length > 0) {
        const item = queue.shift();
        if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
        const record = item as Record<string, unknown>;

        const graph = record['@graph'];
        if (Array.isArray(graph)) queue.push(...graph);

        const typeValue = record['@type'];
        const types = Array.isArray(typeValue) ? typeValue : [typeValue];
        if (
          types.some(
            (type) => typeof type === 'string' && type.toLowerCase() === 'jobposting',
          )
        ) {
          return record;
        }
      }
    } catch {
      // Malformed structured data must not break the extraction.
    }
  }
  return null;
}

function readOrganizationName(value: unknown): string {
  if (typeof value === 'string') return sanitizeLine(value, 200);
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const name = (value as Record<string, unknown>).name;
    if (typeof name === 'string') return sanitizeLine(name, 200);
  }
  return '';
}

function extractMainText(document: Document): string {
  if (!document.body) return '';
  const clone = document.body.cloneNode(true) as HTMLElement;
  clone
    .querySelectorAll(
      'script,style,noscript,template,svg,iframe,canvas,form,button,input,select,textarea,nav,header,footer',
    )
    .forEach((element) => element.remove());

  const candidates = Array.from(clone.querySelectorAll('article, main, [role="main"]'))
    .map((element) => ({
      element,
      length: normalizeExtractedText(visibleText(element)).length,
    }))
    .sort((a, b) => b.length - a.length);

  const root = candidates[0] && candidates[0].length > 250 ? candidates[0].element : clone;
  return normalizeExtractedText(visibleText(root));
}

function visibleText(root: Element): string {
  const parts: string[] = [];

  const visit = (node: Node): void => {
    if (node.nodeType === 3) {
      parts.push((node as Text).data);
      return;
    }
    if (node.nodeType !== 1) return;

    const element = node as Element;
    if (element.tagName === 'BR') {
      parts.push('\n');
      return;
    }

    const isBlock = BLOCK_TAGS.has(element.tagName);
    if (isBlock) parts.push('\n');
    element.childNodes.forEach(visit);
    if (isBlock) parts.push('\n');
  };

  visit(root);
  return parts.join('');
}

function normalizeExtractedText(value: string): string {
  return value
    .replace(/\u00A0/g, ' ')
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
