export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ');
}

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

/** Removes control characters, normalises line endings and enforces a hard cap. */
export function sanitizeText(value: string, maxLength = 30000): string {
  return value
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, maxLength);
}

/** Sanitises a value that is displayed on a single line. */
export function sanitizeLine(value: string, maxLength = 300): string {
  return sanitizeText(value, maxLength).replace(/\s+/g, ' ').trim();
}

export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return (url.protocol === 'http:' || url.protocol === 'https:') && Boolean(url.hostname);
  } catch {
    return false;
  }
}

export function safeFilenamePart(value: string): string {
  return value
    .normalize('NFC')
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-._ ]+|[-._ ]+$/g, '')
    .slice(0, 60);
}

export function countWords(value: string): number {
  const trimmed = value.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

export function formatDateTimeDE(timestamp: number): string {
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp));
}

export function formatLongDateDE(date: Date): string {
  return new Intl.DateTimeFormat('de-DE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function truncateText(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

/** Strips the markdown-shaped output some models produce despite instructions. */
export function cleanGeneratedText(value: string): string {
  let text = value.replace(/\r\n?/g, '\n');
  text = text.replace(/^\s*```(?:markdown|text|md)?\s*\n?/i, '').replace(/\n?```\s*$/, '');
  text = text.replace(/\*\*(.+?)\*\*/g, '$1');
  text = text.replace(/^#{1,6}\s+/gm, '');
  text = text.replace(/[ \t]+\n/g, '\n').replace(/\n{4,}/g, '\n\n\n');
  return text.trim().slice(0, 30000);
}

export function toLines(value: string): string[] {
  return value
    .split('\n')
    .map((line) => line.replace(/^[-*•]\s+/, '').trim())
    .filter(Boolean);
}

const CHARACTER_MAP: Record<string, string> = {
  '\u00A0': ' ',
  '\u00AD': '',
  '\u2007': ' ',
  '\u2009': ' ',
  '\u202F': ' ',
  '\u200B': '',
  '\u2018': "'",
  '\u2019': "'",
  '\u201A': "'",
  '\u201B': "'",
  '\u201C': '"',
  '\u201D': '"',
  '\u201E': '"',
  '\u201F': '"',
  '\u2013': '-',
  '\u2014': '-',
  '\u2212': '-',
  '\u2026': '...',
  '\u2022': '-',
  '\u25CF': '-',
  '\u2192': '->',
};

/**
 * jsPDF's built-in Helvetica uses WinAnsi. Map typographic characters to safe
 * equivalents so exports never contain missing glyphs.
 */
export function toWinAnsiSafe(value: string): string {
  let result = '';
  for (const character of value.normalize('NFC')) {
    const mapped = CHARACTER_MAP[character];
    if (mapped !== undefined) {
      result += mapped;
      continue;
    }
    const code = character.codePointAt(0) ?? 0;
    if (
      character === '\n' ||
      character === '\t' ||
      (code >= 32 && code <= 126) ||
      (code >= 160 && code <= 255) ||
      code === 0x20ac
    ) {
      result += character;
    }
  }
  return result;
}

export function redactSecrets(value: string, secrets: string[] = []): string {
  let result = value.replace(/\b(?:sk|rk)-[A-Za-z0-9_-]{8,}\b/g, '[entfernt]');
  for (const secret of secrets) {
    if (secret.length >= 8) {
      result = result.split(secret).join('[entfernt]');
    }
  }
  return result;
}
