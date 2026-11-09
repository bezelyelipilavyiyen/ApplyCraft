import type { ProviderConfig } from '../types';
import { OPENAI_BASE_URL } from '../types';
import { redactSecrets, sanitizeLine } from '../utils';
import { AiError, type AiProvider, type AiRequest } from './types';

const TIMEOUT_MS = 180_000;
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]', '::1']);

export function createProvider(config: ProviderConfig): AiProvider {
  const model = sanitizeLine(config.model, 120);
  if (!model) {
    throw new AiError('config', 'Bitte gib ein Modell an.');
  }

  if (config.kind === 'openai') {
    const key = config.apiKey.trim();
    if (key.length < 20) {
      throw new AiError('config', 'Bitte gib einen gültigen OpenAI API-Schlüssel ein.');
    }
    return new OpenAiResponsesProvider(key, model);
  }

  const baseUrl = normalizeEndpointBase(config.baseUrl);
  return new CompatibleEndpointProvider(baseUrl, config.apiKey.trim(), model);
}

function normalizeEndpointBase(value: string): string {
  const trimmed = value.trim().replace(/\/+$/, '');
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new AiError('config', 'Die Endpoint-URL ist ungültig.');
  }

  const isLocal = LOCAL_HOSTS.has(url.hostname);
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && isLocal)) {
    throw new AiError('config', 'Der Endpoint muss HTTPS verwenden. HTTP ist nur für localhost erlaubt.');
  }
  if (!url.hostname) {
    throw new AiError('config', 'Die Endpoint-URL enthält keinen Host.');
  }
  return trimmed;
}

interface ResponseShape {
  [key: string]: unknown;
}

function asRecord(value: unknown): ResponseShape | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as ResponseShape)
    : null;
}

function extractProviderError(data: unknown): string | undefined {
  const object = asRecord(data);
  if (!object) return undefined;
  const error = asRecord(object.error);
  if (error && typeof error.message === 'string') return error.message;
  if (typeof object.message === 'string') return object.message;
  return undefined;
}

async function requestJson(
  url: string,
  init: RequestInit,
  signal: AbortSignal | undefined,
  secrets: string[],
): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const abortFromCaller = () => controller.abort();
  if (signal?.aborted) controller.abort();
  signal?.addEventListener('abort', abortFromCaller, { once: true });

  let response: Response;
  try {
    response = await fetch(url, { ...init, signal: controller.signal });
  } catch {
    if (signal?.aborted) {
      throw new AiError('aborted', 'Die KI-Anfrage wurde abgebrochen.');
    }
    if (controller.signal.aborted) {
      throw new AiError(
        'network',
        'Der KI-Anbieter hat nicht rechtzeitig geantwortet. Bitte versuche es erneut.',
      );
    }
    throw new AiError(
      'network',
      'Der KI-Anbieter ist nicht erreichbar. Prüfe Internetverbindung, Endpoint und CORS-Freigabe.',
    );
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abortFromCaller);
  }

  const raw = await response.text();
  let data: unknown = null;
  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    throw mapHttpError(response.status, data, secrets);
  }
  if (data === null) {
    throw new AiError('bad-response', 'Der KI-Anbieter hat keine gültige JSON-Antwort geliefert.');
  }
  return data;
}

function mapHttpError(status: number, data: unknown, secrets: string[]): AiError {
  const message = redactSecrets(extractProviderError(data) ?? '', secrets).slice(0, 240);
  const suffix = message ? ` Details: ${message}` : '';

  if (status === 401 || status === 403) {
    return new AiError(
      'auth',
      `Der API-Schlüssel wurde abgelehnt. Prüfe Schlüssel, Projektzugriff und Abrechnung.${suffix}`,
    );
  }
  if (status === 404) {
    return new AiError(
      'server',
      `Endpoint oder Modell wurde nicht gefunden. Prüfe Basis-URL und Modellname.${suffix}`,
    );
  }
  if (status === 429) {
    return new AiError(
      'rate-limit',
      `Das Kontingent ist erschöpft oder das Rate-Limit erreicht. Prüfe Guthaben und Limits beim Anbieter.${suffix}`,
    );
  }
  if (status >= 500) {
    return new AiError('server', `Der KI-Anbieter meldet einen Serverfehler (HTTP ${status}).${suffix}`);
  }
  return new AiError('server', `Die Anfrage wurde abgelehnt (HTTP ${status}).${suffix}`);
}

class OpenAiResponsesProvider implements AiProvider {
  readonly label = 'OpenAI API';
  private readonly apiKey: string;
  private readonly model: string;

  constructor(apiKey: string, model: string) {
    this.apiKey = apiKey;
    this.model = model;
  }

  async complete(request: AiRequest): Promise<string> {
    const data = await requestJson(
      `${OPENAI_BASE_URL}/responses`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          instructions: request.system,
          input: request.user,
          // Do not let OpenAI retain the request/response for later retrieval.
          store: false,
        }),
      },
      request.signal,
      [this.apiKey],
    );

    const text = extractResponsesText(data);
    if (!text) {
      throw new AiError(
        'empty',
        'Die KI hat eine leere Antwort geliefert. Bitte versuche es erneut oder wähle ein anderes Modell.',
      );
    }
    return text;
  }
}

function extractResponsesText(data: unknown): string {
  const object = asRecord(data);
  if (!object) return '';

  if (typeof object.output_text === 'string' && object.output_text.trim()) {
    return object.output_text.trim();
  }

  const output = Array.isArray(object.output) ? object.output : [];
  const parts: string[] = [];
  for (const item of output) {
    const entry = asRecord(item);
    if (!entry) continue;
    const content = Array.isArray(entry.content) ? entry.content : [];
    for (const chunk of content) {
      const part = asRecord(chunk);
      if (!part) continue;
      if (typeof part.text === 'string' && (part.type === 'output_text' || entry.type === 'message')) {
        parts.push(part.text);
      }
    }
  }
  return parts.join('\n').trim();
}

class CompatibleEndpointProvider implements AiProvider {
  readonly label = 'Eigener Endpoint';
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly model: string;

  constructor(baseUrl: string, apiKey: string, model: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    this.model = model;
  }

  async complete(request: AiRequest): Promise<string> {
    const endpoint = this.baseUrl.endsWith('/chat/completions')
      ? this.baseUrl
      : `${this.baseUrl}/chat/completions`;

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.apiKey) headers.Authorization = `Bearer ${this.apiKey}`;

    const data = await requestJson(
      endpoint,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: request.system },
            { role: 'user', content: request.user },
          ],
          stream: false,
        }),
      },
      request.signal,
      [this.apiKey],
    );

    const text = extractChatCompletionText(data);
    if (!text) {
      throw new AiError(
        'empty',
        'Die KI hat eine leere Antwort geliefert. Prüfe Modell und Endpoint.',
      );
    }
    return text;
  }
}

function extractChatCompletionText(data: unknown): string {
  const object = asRecord(data);
  if (!object) return '';
  const choices = Array.isArray(object.choices) ? object.choices : [];
  const first = asRecord(choices[0]);
  if (!first) return '';

  const message = asRecord(first.message);
  if (message) {
    if (typeof message.content === 'string' && message.content.trim()) {
      return message.content.trim();
    }
    if (Array.isArray(message.content)) {
      const parts: string[] = [];
      for (const chunk of message.content) {
        const part = asRecord(chunk);
        if (part && typeof part.text === 'string') parts.push(part.text);
      }
      const joined = parts.join('\n').trim();
      if (joined) return joined;
    }
  }

  if (typeof first.text === 'string') return first.text.trim();
  return '';
}
