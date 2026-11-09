import { Icon } from './Icons';
import { Brand } from './Ui';

export function Footer() {
  return (
    <footer className="mt-12 border-t border-line/80 py-8 sm:mt-16">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-5 sm:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <Brand />
            <span className="hidden h-4 w-px bg-line sm:block" aria-hidden="true" />
            <span className="hidden text-[11px] text-faint sm:block">
              Statisch. Ohne Server. Ohne Datenbank.
            </span>
          </div>

          <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <a
              href="#top"
              className="inline-flex items-center gap-1 text-[11.5px] text-muted transition-colors hover:text-ink"
            >
              <Icon name="arrowUp" className="h-3 w-3" />
              Nach oben
            </a>
            <a
              href="#datenschutz"
              className="text-[11.5px] text-muted transition-colors hover:text-ink"
            >
              Datenschutz
            </a>
            <a
              href="https://developers.openai.com/siwc"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11.5px] text-muted transition-colors hover:text-ink"
            >
              ChatGPT-OAuth
              <Icon name="external" className="h-3 w-3" />
            </a>
          </nav>
        </div>

        <p className="max-w-3xl text-[10.5px] leading-relaxed text-faint">
          ApplyCraft ist ein unabhängiges Projekt ohne Server und Datenbank und steht in keiner
          Verbindung zu OpenAI. ChatGPT und OpenAI sind Marken von OpenAI. Für die Nutzung einer
          KI-API gelten die Bedingungen und Datenschutzbestimmungen des jeweiligen Anbieters.
        </p>
      </div>
    </footer>
  );
}
