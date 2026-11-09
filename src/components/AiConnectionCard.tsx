import { useState, type FormEvent } from 'react';
import { createProvider } from '../lib/ai/openai';
import { describeAiError } from '../lib/ai/types';
import type { ProviderConfig, ProviderKind } from '../lib/types';
import {
  DEFAULT_OPENAI_MODEL,
  OPENAI_BASE_URL,
  SUGGESTED_MODELS,
} from '../lib/types';
import { cx } from '../lib/utils';
import { Icon } from './Icons';
import { Field, InlineNote, SectionCard, Spinner, StatusPill } from './Ui';

export interface AiConnectionCardProps {
  provider: ProviderConfig | null;
  onConnect: (config: ProviderConfig) => void;
  onDisconnect: () => void;
}

type TestState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; message: string }
  | { status: 'error'; message: string };

export function AiConnectionCard({
  provider,
  onConnect,
  onDisconnect,
}: AiConnectionCardProps) {
  const [kind, setKind] = useState<ProviderKind>('openai');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState(DEFAULT_OPENAI_MODEL);
  const [baseUrl, setBaseUrl] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [testState, setTestState] = useState<TestState>({ status: 'idle' });

  function selectKind(next: ProviderKind) {
    setKind(next);
    setFormError(null);
    setTestState({ status: 'idle' });
  }

  function handleConnect(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setTestState({ status: 'idle' });

    if (kind === 'openai' && apiKey.trim().length < 20) {
      setFormError('Bitte gib einen gültigen OpenAI API-Schlüssel ein.');
      return;
    }
    if (kind === 'endpoint' && !baseUrl.trim()) {
      setFormError('Bitte gib die URL deines Endpoints an.');
      return;
    }
    if (!model.trim()) {
      setFormError('Bitte gib ein Modell an.');
      return;
    }

    const config: ProviderConfig =
      kind === 'openai'
        ? {
            kind,
            apiKey: apiKey.trim(),
            model: model.trim(),
            baseUrl: OPENAI_BASE_URL,
          }
        : {
            kind,
            apiKey: apiKey.trim(),
            model: model.trim(),
            baseUrl: baseUrl.trim(),
          };

    try {
      createProvider(config);
    } catch (error) {
      setFormError(describeAiError(error));
      return;
    }

    onConnect(config);
    setApiKey('');
    setShowKey(false);
  }

  async function handleTest() {
    if (!provider) return;
    setTestState({ status: 'loading' });
    try {
      const client = createProvider(provider);
      await client.complete({
        system: 'Du bist ein Verbindungstest. Antworte ausschließlich mit dem Wort OK.',
        user: 'Antworte mit OK.',
      });
      setTestState({
        status: 'success',
        message: 'Die Verbindung funktioniert. Das Modell hat geantwortet.',
      });
    } catch (error) {
      setTestState({ status: 'error', message: describeAiError(error) });
    }
  }

  function handleDisconnect() {
    setTestState({ status: 'idle' });
    setFormError(null);
    setApiKey('');
    setShowKey(false);
    onDisconnect();
  }

  return (
    <SectionCard
      id="ki"
      index="01"
      title="KI verbinden"
      description="OpenAI API oder ein OpenAI-kompatibler Endpoint. Kein ChatGPT-Passwort, keine Schlüssel im Quellcode."
      action={
        provider ? (
          <StatusPill tone="ok">Verbunden</StatusPill>
        ) : (
          <StatusPill tone="neutral">Nicht verbunden</StatusPill>
        )
      }
    >
      {provider ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ok/20 bg-ok/[.04] p-4">
            <div className="flex min-w-0 items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-ok/25 bg-ok/10 text-ok">
                <Icon name="check" className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">KI ist verbunden</p>
                <p className="mt-0.5 truncate text-xs text-muted">
                  {provider.kind === 'openai'
                    ? 'OpenAI API'
                    : `Eigener Endpoint · ${endpointHost(provider.baseUrl)}`}
                  <span className="mx-1.5 text-faint">·</span>
                  <span className="font-mono text-[11.5px] text-ink/80">{provider.model}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => void handleTest()}
                className="btn btn-secondary btn-sm"
                disabled={testState.status === 'loading'}
              >
                {testState.status === 'loading' ? (
                  <Spinner className="h-3.5 w-3.5" />
                ) : (
                  <Icon name="refresh" className="h-3.5 w-3.5" />
                )}
                Testen
              </button>
              <button type="button" onClick={handleDisconnect} className="btn btn-ghost btn-sm">
                Trennen
              </button>
            </div>
          </div>

          {testState.status === 'loading' ? (
            <InlineNote tone="info" icon="spinner">
              Mini-Anfrage läuft. Dabei können minimale API-Kosten entstehen.
            </InlineNote>
          ) : null}
          {testState.status === 'success' ? (
            <InlineNote tone="success">{testState.message}</InlineNote>
          ) : null}
          {testState.status === 'error' ? (
            <InlineNote tone="danger">{testState.message}</InlineNote>
          ) : null}

          <InlineNote tone="info" icon="shield">
            Der Schlüssel liegt nur im Arbeitsspeicher dieses Tabs. Er wird nicht in
            localStorage, Cookies oder im Code gespeichert und ist nach einem Neuladen weg.
          </InlineNote>
        </div>
      ) : (
        <>
          <div
            role="group"
            aria-label="KI-Anbieter wählen"
            className="flex gap-1 rounded-xl border border-line bg-[#0a0c0e] p-1"
          >
            <button
              type="button"
              aria-pressed={kind === 'openai'}
              onClick={() => selectKind('openai')}
              className={cx(
                'choice inline-flex flex-1 items-center justify-center gap-1.5',
                kind === 'openai' ? 'choice-active' : 'choice-idle',
              )}
            >
              <Icon name="key" className="h-3.5 w-3.5" />
              OpenAI API
            </button>
            <button
              type="button"
              aria-pressed={kind === 'endpoint'}
              onClick={() => selectKind('endpoint')}
              className={cx(
                'choice inline-flex flex-1 items-center justify-center gap-1.5',
                kind === 'endpoint' ? 'choice-active' : 'choice-idle',
              )}
            >
              <Icon name="server" className="h-3.5 w-3.5" />
              Eigener Endpoint
            </button>
          </div>

          <form onSubmit={handleConnect} className="mt-4 space-y-4" autoComplete="off">
            {kind === 'openai' ? (
              <>
                <Field
                  label="OpenAI API-Schlüssel"
                  htmlFor="openai-key"
                  required
                  hint="Wird ausschließlich an api.openai.com gesendet und nur im Arbeitsspeicher gehalten."
                >
                  <div className="relative">
                    <input
                      id="openai-key"
                      name="openai-api-key"
                      type={showKey ? 'text' : 'password'}
                      value={apiKey}
                      onChange={(event) => setApiKey(event.target.value)}
                      autoComplete="off"
                      spellCheck={false}
                      className="input pr-11 font-mono text-[13px]"
                      placeholder="sk-…"
                      maxLength={256}
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey((current) => !current)}
                      className="btn btn-ghost absolute right-1.5 top-1/2 h-8 w-8 -translate-y-1/2 rounded-lg p-0"
                      aria-label={showKey ? 'Schlüssel ausblenden' : 'Schlüssel anzeigen'}
                    >
                      <Icon name={showKey ? 'eyeOff' : 'eye'} className="h-4 w-4" />
                    </button>
                  </div>
                </Field>

                <Field
                  label="Modell"
                  htmlFor="openai-model"
                  required
                  hint="Empfohlen: gpt-4.1-mini. Die Modellliste kann sich ändern."
                >
                  <input
                    id="openai-model"
                    name="openai-model"
                    type="text"
                    value={model}
                    onChange={(event) => setModel(event.target.value)}
                    list="applycraft-models"
                    className="input font-mono text-[13px]"
                    autoComplete="off"
                    spellCheck={false}
                    maxLength={120}
                  />
                  <datalist id="applycraft-models">
                    {SUGGESTED_MODELS.map((suggestion) => (
                      <option key={suggestion} value={suggestion} />
                    ))}
                  </datalist>
                </Field>

                <InlineNote tone="warn">
                  Ein ChatGPT-Abo enthält kein API-Guthaben; API-Nutzung wird separat abgerechnet.
                  Für den Produktivbetrieb empfiehlt OpenAI einen Server-Proxy statt eines
                  Browser-Schlüssels. Nutze deshalb am besten einen Schlüssel mit Ausgabenlimit.
                </InlineNote>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <button type="submit" className="btn btn-primary">
                    <Icon name="key" className="h-4 w-4" />
                    Verbinden
                  </button>
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link inline-flex items-center gap-1 text-xs"
                  >
                    Schlüssel erstellen
                    <Icon name="external" className="h-3 w-3" />
                  </a>
                </div>
              </>
            ) : (
              <>
                <Field
                  label="Endpoint-URL"
                  htmlFor="endpoint-url"
                  required
                  hint="Wird bei Bedarf um /chat/completions ergänzt. HTTPS ist Pflicht, HTTP nur für localhost."
                >
                  <input
                    id="endpoint-url"
                    name="endpoint-url"
                    type="url"
                    value={baseUrl}
                    onChange={(event) => setBaseUrl(event.target.value)}
                    className="input font-mono text-[13px]"
                    placeholder="https://dein-proxy.example.com/v1"
                    autoComplete="off"
                    spellCheck={false}
                    maxLength={2048}
                  />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="API-Token (optional)"
                    htmlFor="endpoint-key"
                    hint="Nur nötig, wenn dein Endpoint eine Authentifizierung verlangt."
                  >
                    <div className="relative">
                      <input
                        id="endpoint-key"
                        name="endpoint-token"
                        type={showKey ? 'text' : 'password'}
                        value={apiKey}
                        onChange={(event) => setApiKey(event.target.value)}
                        autoComplete="off"
                        spellCheck={false}
                        className="input pr-11 font-mono text-[13px]"
                        placeholder="optional"
                        maxLength={512}
                      />
                      <button
                        type="button"
                        onClick={() => setShowKey((current) => !current)}
                        className="btn btn-ghost absolute right-1.5 top-1/2 h-8 w-8 -translate-y-1/2 rounded-lg p-0"
                        aria-label={showKey ? 'Token ausblenden' : 'Token anzeigen'}
                      >
                        <Icon name={showKey ? 'eyeOff' : 'eye'} className="h-4 w-4" />
                      </button>
                    </div>
                  </Field>

                  <Field label="Modell" htmlFor="endpoint-model" required>
                    <input
                      id="endpoint-model"
                      name="endpoint-model"
                      type="text"
                      value={model}
                      onChange={(event) => setModel(event.target.value)}
                      className="input font-mono text-[13px]"
                      placeholder="z. B. llama3.1"
                      autoComplete="off"
                      spellCheck={false}
                      maxLength={120}
                    />
                  </Field>
                </div>

                <InlineNote tone="info" icon="server">
                  Der Endpoint erhält deine Eingaben direkt und muss CORS erlauben. Betreibst du
                  einen eigenen Proxy, bleibt der eigentliche API-Schlüssel auf dem Server.
                </InlineNote>

                <div className="pt-1">
                  <button type="submit" className="btn btn-primary">
                    <Icon name="server" className="h-4 w-4" />
                    Endpoint verbinden
                  </button>
                </div>
              </>
            )}

            {formError ? <InlineNote tone="danger">{formError}</InlineNote> : null}
          </form>
        </>
      )}

      <div className="mt-5 rounded-xl border border-line bg-white/[.018] p-4">
        <div className="flex gap-2.5">
          <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0 text-accent/80" />
          <div>
            <p className="text-xs font-medium text-ink">Warum kein ChatGPT-Login?</p>
            <p className="mt-1 text-[11.5px] leading-relaxed text-faint">
              OpenAI bietet „Sign in with ChatGPT“ für lokale Open-Source-Clients per
              Loopback-Callback sowie für ausgewählte Partner mit Freigabe an. Eine rein statische
              Website auf GitHub Pages kann diesen OAuth-Flow nicht abschließen. Deshalb gibt es
              hier keinen Login-Button, der eine Verbindung nur vortäuscht. Dein ChatGPT-Passwort
              wird nie abgefragt.{' '}
              <a
                href="https://developers.openai.com/siwc"
                target="_blank"
                rel="noopener noreferrer"
                className="link"
              >
                Offizielle Dokumentation
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

function endpointHost(value: string): string {
  try {
    return new URL(value).host;
  } catch {
    return value;
  }
}
