export type AiErrorCode =
  | 'config'
  | 'auth'
  | 'rate-limit'
  | 'network'
  | 'server'
  | 'bad-response'
  | 'empty'
  | 'aborted';

export class AiError extends Error {
  readonly code: AiErrorCode;
  readonly detail?: string;

  constructor(code: AiErrorCode, message: string, detail?: string) {
    super(message);
    this.name = 'AiError';
    this.code = code;
    this.detail = detail;
  }
}

export interface AiRequest {
  system: string;
  user: string;
  signal?: AbortSignal;
}

export interface AiProvider {
  readonly label: string;
  complete(request: AiRequest): Promise<string>;
}

export function describeAiError(error: unknown): string {
  if (error instanceof AiError) return error.message;
  return 'Bei der KI-Anfrage ist ein unerwarteter Fehler aufgetreten. Bitte versuche es erneut.';
}
