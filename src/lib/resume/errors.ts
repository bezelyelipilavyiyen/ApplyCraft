export type ResumeFailure = 'type' | 'size' | 'password' | 'empty' | 'corrupt';

export class ResumeParseError extends Error {
  readonly reason: ResumeFailure;

  constructor(reason: ResumeFailure, message: string) {
    super(message);
    this.name = 'ResumeParseError';
    this.reason = reason;
  }
}

export function describeResumeError(error: unknown): string {
  if (error instanceof ResumeParseError) return error.message;
  return 'Die PDF-Datei konnte nicht gelesen werden. Möglicherweise ist sie beschädigt oder geschützt.';
}
