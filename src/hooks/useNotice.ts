import { useCallback, useEffect, useRef, useState } from 'react';

export type NoticeTone = 'success' | 'error' | 'info';

export interface Notice {
  id: number;
  tone: NoticeTone;
  message: string;
}

export function useNotice(autoDismissMs = 11000) {
  const [notice, setNotice] = useState<Notice | null>(null);
  const counter = useRef(0);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => {
      setNotice((current) => (current && current.id === notice.id ? null : current));
    }, autoDismissMs);
    return () => window.clearTimeout(timer);
  }, [notice, autoDismissMs]);

  const show = useCallback((tone: NoticeTone, message: string) => {
    counter.current += 1;
    setNotice({ id: counter.current, tone, message });
  }, []);

  const dismiss = useCallback(() => setNotice(null), []);

  return { notice, show, dismiss };
}
