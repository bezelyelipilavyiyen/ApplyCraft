import { Icon } from './Icons';

const STEPS = [
  {
    number: '01',
    title: 'KI verbinden',
    text: 'Eigener OpenAI-Schlüssel oder ein kompatibler Endpoint – nur im Arbeitsspeicher.',
  },
  {
    number: '02',
    title: 'Profil & Stelle',
    text: 'Persönliche Daten eintragen, Lebenslauf optional als PDF einlesen, Stellenanzeige einfügen.',
  },
  {
    number: '03',
    title: 'Dokumente generieren',
    text: 'Anschreiben und Lebenslauf entstehen aus deinen echten Angaben und der konkreten Stelle.',
  },
  {
    number: '04',
    title: 'Prüfen & exportieren',
    text: 'Im Editor anpassen und als sauber gesetztes PDF oder als TXT herunterladen.',
  },
];

export function Hero() {
  return (
    <section className="pb-8 pt-12 sm:pt-16 lg:pb-10 lg:pt-20">
      <div className="grid items-center gap-10 lg:grid-cols-[1.12fr_.88fr] lg:gap-14">
        <div className="rise">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-white/[.025] px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
            <span className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-muted">
              KI-Bewerbungsassistent
            </span>
          </div>

          <h1 className="max-w-[15ch] text-balance text-[2.65rem] font-semibold leading-[1.02] tracking-[-0.04em] text-ink sm:text-6xl lg:text-[4.1rem]">
            Bewerbungen,
            <br />
            <span className="text-ink/50">
              die nach dir klingen<span className="text-accent">.</span>
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-muted sm:text-base">
            Anschreiben und Lebenslauf, formuliert aus deiner echten Erfahrung und zugeschnitten
            auf die Stelle. In Minuten, direkt im Browser – ohne Konto und ohne dauerhafte
            Speicherung.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a href="#ki" className="btn btn-primary h-11 px-5">
              Bewerbung starten
              <Icon name="arrowRight" className="h-4 w-4" />
            </a>
            <a href="#datenschutz" className="btn btn-ghost h-11">
              Wie deine Daten geschützt sind
            </a>
          </div>

          <ul className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-faint">
            <li className="flex items-center gap-1.5">
              <Icon name="shield" className="h-3.5 w-3.5 text-ok/75" />
              Kein ApplyCraft-Konto
            </li>
            <li className="flex items-center gap-1.5">
              <Icon name="check" className="h-3.5 w-3.5 text-ok/75" />
              Keine Speicherung im Browser
            </li>
            <li className="flex items-center gap-1.5">
              <Icon name="fileText" className="h-3.5 w-3.5 text-ok/75" />
              PDF- &amp; TXT-Export
            </li>
          </ul>
        </div>

        <aside className="rise rise-delay-1 relative overflow-hidden rounded-3xl border border-line bg-panel/80 p-6 shadow-[0_30px_80px_-50px_rgba(0,0,0,.95)] sm:p-7">
          <div
            className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-accent/[.07] blur-3xl"
            aria-hidden="true"
          />
          <div className="relative">
            <div className="flex items-center justify-between">
              <span className="eyebrow">Der Ablauf</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-accent/20 bg-accent/[.06] text-accent">
                <Icon name="sparkles" className="h-4 w-4" />
              </span>
            </div>

            <ol className="mt-6 space-y-5">
              {STEPS.map((step) => (
                <li key={step.number} className="flex gap-3.5">
                  <span className="pt-0.5 font-mono text-[10px] tracking-wider text-accent/65">
                    {step.number}
                  </span>
                  <div>
                    <p className="text-[13px] font-medium text-ink">{step.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-faint">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-6 flex items-start gap-2.5 border-t border-line pt-5 text-xs leading-relaxed text-muted">
              <Icon name="shield" className="mt-0.5 h-4 w-4 shrink-0 text-ok/80" />
              <p>
                Keine Server, keine Datenbank, keine Tracker. Was du eingibst, bleibt in dieser
                Browser-Sitzung.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
