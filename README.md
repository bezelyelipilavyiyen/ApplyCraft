# ApplyCraft

ApplyCraft ist ein KI-Bewerbungsassistent als statische React-Web-App. Aus einem Profil und einer
Stellenanzeige entstehen ein individuelles Anschreiben, ein angepasster Lebenslauf und optional
eine kurze Bewerbungs-E-Mail. Die Texte lassen sich im Browser bearbeiten und als PDF oder TXT
exportieren.

**Es gibt keinen ApplyCraft-Server, keine Datenbank und keine dauerhafte Speicherung.** Formular,
hochgeladene PDFs, generierte Dokumente und die KI-Verbindung existieren ausschließlich im
Arbeitsspeicher der aktuellen Browser-Sitzung.

> **Wichtig zur ChatGPT-Anbindung:** Ein ChatGPT-Abo (Plus/Pro) enthält keinen kostenlosen
> API-Zugriff. OpenAI bietet „Sign in with ChatGPT“ für lokale Open-Source-Clients per
> Loopback-Callback und für ausgewählte Partner an. Eine statisch auf GitHub Pages gehostete App
> kann diesen OAuth-Flow derzeit nicht abschließen. ApplyCraft implementiert deshalb bewusst
> **keinen Fake-Login**, sondern die offiziell unterstützte API-Nutzung: eigenen OpenAI-API-Schlüssel
> oder einen OpenAI-kompatiblen Endpoint.

---

## Inhalt

- [Funktionen](#funktionen)
- [Schnellstart](#schnellstart)
- [KI verbinden](#ki-verbinden)
- [Datenschutz und Löschung](#datenschutz-und-löschung)
- [GitHub Pages deployen](#github-pages-deployen)
- [Bedienung](#bedienung)
- [Architektur](#architektur)
- [Sicherheit](#sicherheit)
- [Grenzen und ehrliche Hinweise](#grenzen-und-ehrliche-hinweise)
- [Fehlerbehebung](#fehlerbehebung)

---

## Funktionen

- Profilformular mit Browser-Autofill-Unterstützung (`given-name`, `street-address`, `email`, …)
- Optionale lokale Text-Extraktion aus einem bestehenden Lebenslauf-PDF (pdf.js)
- Stellenanzeige per URL auslesen – inklusive `JobPosting`-JSON-LD – oder als Text einfügen
- KI-gestützte Extraktion von Unternehmen, Rolle, Anforderungen und Aufgaben
- Anschreiben, Lebenslauf und Bewerbungs-E-Mail auf Deutsch, ausschließlich aus vorhandenen Fakten
- Bearbeitbarer Ergebnis-Editor mit Wortzähler
- PDF-Export über jsPDF mit Briefkopf, Abschnittsformatierung, Aufzählungen und sauberen
  Seitenumbrüchen (A4)
- TXT-Export pro Dokument oder für alle Dokumente zusammen
- Checkbox „Meine persönlichen Daten und Eingaben nach der Generierung automatisch löschen“
  (standardmäßig aktiv)
- Button „Alle Daten jetzt löschen“ mit Bestätigungsdialog
- Strenges, dark-minimalistisches UI ohne externe Schriftarten, Tracker oder Bilder

Keine Anmeldung bei ApplyCraft, keine Cookies, kein `localStorage`, kein `sessionStorage`.

---

## Schnellstart

Voraussetzungen:

- Node.js **>= 22.13** (pdf.js 6 verlangt diese Version)
- npm

```bash
npm install
npm run dev
```

Vite zeigt die lokale Adresse an (standardmäßig `http://localhost:5173`).

Weitere Befehle:

```bash
npm run typecheck   # TypeScript ohne Emit
npm run build       # tsc + Produktionsbuild nach dist/
npm run preview     # Produktionsbuild lokal ansehen
```

Es werden **keine Umgebungsvariablen und keine `.env`-Datei** benötigt. Insbesondere ist nirgends
ein API-Schlüssel einkompiliert.

---

## KI verbinden

Beim ersten Öffnen der App ist keine KI verbunden. Ohne Verbindung bleiben die
Generierungsbuttons deaktiviert; die App zeigt einen verständlichen Hinweis. Es gibt keine
simulierte Generierung.

### Variante A: OpenAI-API-Schlüssel (schnellster Weg)

1. Auf <https://platform.openai.com/api-keys> einen API-Schlüssel erstellen.
2. Bei OpenAI ein Zahlungsmittel/Guthaben für die API hinterlegen (die API wird separat vom
   ChatGPT-Abo abgerechnet).
3. In ApplyCraft unter **01 · KI verbinden → OpenAI API** den Schlüssel und ein Modell eintragen
   und **Verbinden** wählen.
4. Optional **Testen** – das sendet eine winzige Anfrage („Antworte mit OK“) und kann minimale
   Kosten verursachen.

Eigenschaften dieser Variante:

- Der Schlüssel wird nur im React-Speicher gehalten. Er wird nicht in `localStorage`, Cookies,
  IndexedDB oder den Quellcode geschrieben und ist nach dem Neuladen des Tabs weg.
- Die Requests gehen direkt an `https://api.openai.com/v1/responses`, mit `store: false`, damit
  OpenAI die Anfrage nicht für späteres Abrufen speichert.
- Ein Browser-Schlüssel ist grundsätzlich für Erweiterungen und DevTools sichtbar. OpenAI empfiehlt
  für Produktivsysteme einen Server-Proxy. Nutze deshalb einen eigenen Schlüssel mit
  Ausgabenlimit – niemals einen Schlüssel, der auch anderswo verwendet wird.
- Modellvorschläge: `gpt-4.1-mini`, `gpt-4.1`, `gpt-4o-mini`, `gpt-4o`. Modellnamen können sich
  ändern; das Feld ist frei editierbar.

### Variante B: Eigener OpenAI-kompatibler Endpoint (empfohlen für Produktivbetrieb)

Der Endpoint muss `POST /chat/completions` im OpenAI-Format anbieten und CORS für deine
GitHub-Pages-Origin erlauben.

- **HTTPS ist Pflicht**, HTTP ist nur für `localhost`/`127.0.0.1` erlaubt.
- Ein API-Schlüssel ist optional (zum Beispiel, wenn dein Proxy die Authentifizierung selbst
  übernimmt).
- Gibt man eine URL an, die bereits auf `/chat/completions` endet, wird nichts ergänzt.
- Lokale Modelle, z. B. Ollama: Basis-URL `http://localhost:11434/v1`, Modell z. B. `llama3.1`.
  Ollama muss Browser-Origins erlauben (`OLLAMA_ORIGINS`).

#### Optionaler Proxy, damit kein Schlüssel im Browser liegt

Die sicherste Variante ist ein kleiner Proxy, der den OpenAI-Schlüssel serverseitig hält. Das
folgende Beispiel ist ein Cloudflare Worker (kostenloses Kontingent möglich). Der Schlüssel wird
dort als Secret `OPENAI_API_KEY` hinterlegt, nicht im Repo und nicht im Browser.

```js
export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin');
    const allowed = 'https://DEIN-NAME.github.io';

    if (origin !== allowed) {
      return new Response('Forbidden', { status: 403 });
    }

    const cors = {
      'Access-Control-Allow-Origin': allowed,
      'Access-Control-Allow-Headers': 'content-type, authorization',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      Vary: 'Origin',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    const url = new URL(request.url);
    if (request.method !== 'POST' || url.pathname !== '/v1/chat/completions') {
      return new Response('Not found', { status: 404, headers: cors });
    }

    const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: await request.text(),
    });

    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        ...cors,
        'content-type': upstream.headers.get('content-type') ?? 'application/json',
      },
    });
  },
};
```

Danach in ApplyCraft **Eigener Endpoint** wählen, die Worker-URL eintragen (z. B.
`https://applycraft-proxy.dein-name.workers.dev/v1`) und das gewünschte Modell angeben.

Hinweise:

- Origin-Prüfung ist kein Ersatz für Authentifizierung, verhindert aber einfache Fremdnutzung.
  Ergänze bei Bedarf ein Rate-Limit und ein Modell-Allowlist im Proxy.
- Der Proxy erhält die kompletten Prompt-Inhalte. Er muss genauso vertrauenswürdig sein wie der
  KI-Anbieter selbst.
- Die Content Security Policy erlaubt `https:` für alle Endpoints sowie HTTP nur für localhost.
  Ein HTTP-Endpoint im LAN wird deshalb im Produktionsbuild blockiert.

### Warum kein „Mit ChatGPT anmelden“-Button?

Die offizielle OpenAI-Dokumentation zu „Sign in with ChatGPT“ beschreibt zwei Wege:

1. lokale Open-Source-Clients mit Loopback-Callback (`127.0.0.1`),
2. ausgewählte kommerzielle Partner mit Freigabe und registriertem Callback.

Eine rein statische Website auf GitHub Pages hat weder einen lokalen Callback-Listener noch eine
serverseitige Token-Exchange-Komponente und ist kein freigegebener Partner. Ein Login-Button wäre
daher eine Attrappe. ApplyCraft zeigt stattdessen diese Erklärung im UI und verlinkt die offizielle
Dokumentation: <https://developers.openai.com/siwc>.

Falls OpenAI den Flow später für gehostete Apps öffnet, kann ein weiterer Provider ergänzt werden,
ohne die Oberfläche oder die Prompt-Schicht umzubauen (siehe [Architektur](#architektur)).

---

## Datenschutz und Löschung

### Was ApplyCraft tut

| Bereich | Verhalten |
| --- | --- |
| Profil, Stelle, Ergebnisse | Nur im Arbeitsspeicher (React State) |
| Persistenz | Keine Datenbank, kein `localStorage`, kein `sessionStorage`, keine Cookies |
| Tracking | Keine Analytics, keine Werbe- oder Fehler-Tracker |
| PDF-Upload | Wird lokal mit pdf.js ausgelesen; die Datei wird nicht hochgeladen |
| KI-Anfragen | Direkt vom Browser an den von dir gewählten Anbieter |
| API-Schlüssel | Nur im Arbeitsspeicher; nach Neuladen weg |
| Fehlerlogs | Keine Ausgabe persönlicher Daten in die Konsole |
| Externe Assets | Keine Schriftarten, Skripte oder Bilder von Drittanbietern |

### Was die Checkbox löscht

Die Checkbox bei der Generierung ist standardmäßig aktiv. Nach einer **vollständig erfolgreichen**
Generierung werden Profil, ausgelesener Lebenslauf inklusive Dateiname/Seitenzahl und sämtliche
Stellendaten aus dem State entfernt. Die generierten Dokumente bleiben sichtbar, damit du sie
bearbeiten und exportieren kannst. Bei einem Teilfehler bleiben die Eingaben erhalten, damit du
den Vorgang wiederholen kannst.

Weil die Eingaben danach weg sind, sollten Anschreiben und Lebenslauf mit dem Button
**„Anschreiben & Lebenslauf“** in einem Schritt erzeugt werden. Einzelne Dokumente lassen sich
danach nur mit erneut eingegebenen Daten generieren.

### Was „Alle Daten jetzt löschen“ löscht

- alle Profil- und Berufsfelder,
- den ausgelesenen PDF-Text und die Dateireferenz,
- Stellen-URL, Anzeigentext und analysierte Stellenfelder,
- alle generierten Dokumente und den Editor,
- die KI-Verbindung inklusive Schlüssel und lokaler Verbindungsentwürfe,
- laufende Fetch-/Analyse-Zustände und Fehlermeldungen.

Die App kehrt in den Ausgangszustand zurück; die Checkbox steht wieder auf „an“. Der Button fragt
vorher nach, weil die Aktion nicht rückgängig gemacht werden kann.

### Was Löschen nicht kann

- **Bereits übertragene Daten** an OpenAI oder einen anderen Anbieter können nicht aus dem Browser
  zurückgerufen werden. Dort gelten die Bedingungen und Aufbewahrungsfristen des Anbieters.
  OpenAI-Requests werden mit `store: false` gesendet; das ist eine Einstellung des API-Requests,
  keine Garantie über alle Verarbeitungsschritte des Anbieters hinweg.
- Der Browser kann Speicherinhalte (z. B. DevTools, Erweiterungen, Absturzabbilder) nicht
  vollständig kontrollieren. Die Aussage „aus dem Arbeitsspeicher entfernt“ bezieht sich auf den
  Zustand der Anwendung.
- GitHub Pages als Hoster verarbeitet technisch notwendige Zugriffsdaten (z. B. IP-Adresse in
  Server-Logs). ApplyCraft selbst sendet keine Formulardaten an GitHub.
- Ein Neuladen des Tabs löscht alle Sitzungsdaten; es gibt bewusst keine Wiederherstellung.

Es werden keine Datenschutz-Garantien oder Rechtskonformitätsaussagen versprochen, die die App
nicht technisch einhalten kann. Für die Verarbeitung durch den KI-Anbieter ist dessen
Datenschutzerklärung maßgeblich.

---

## GitHub Pages deployen

Das Projekt ist für ein **GitHub-Pages-Projekt-Repository** vorbereitet. `vite.config.ts` nutzt
`base: './'`, damit die Assets auch unter `https://<user>.github.io/<repo>/` funktionieren. Der
Workflow liegt unter `.github/workflows/deploy.yml`.

1. Neues Repository auf GitHub anlegen und den Code auf den Branch `main` pushen:

   ```bash
   git init
   git add .
   git commit -m "ApplyCraft initial"
   git branch -M main
   git remote add origin https://github.com/<user>/<repo>.git
   git push -u origin main
   ```

2. Im Repository **Settings → Pages → Build and deployment** als Source **GitHub Actions** wählen.
3. Der Workflow „Deploy to GitHub Pages“ startet bei jedem Push auf `main` (oder manuell über
   **Actions → Run workflow**). Er installiert mit `npm ci`, prüft die Typen, baut und deployt
   `dist/`.
4. Nach dem Lauf steht die URL im Deployment-Schritt und unter **Settings → Pages**
   (`https://<user>.github.io/<repo>/`).

Wichtig:

- `package-lock.json` muss eingecheckt sein, weil der Workflow `npm ci` verwendet.
- **Keine API-Schlüssel als GitHub Secret hinterlegen.** Der Build braucht keine Schlüssel; sie
  werden zur Laufzeit vom Nutzer eingegeben. GitHub Secrets wären hier nur eine zusätzliche
  Angriffsfläche.
- Ein eigener Domainname kann unter **Settings → Pages → Custom domain** gesetzt werden. Die
  relative Basis funktioniert weiterhin.
- Die Content Security Policy wird nur in den Produktionsbuild injiziert. Der Dev-Server bleibt
  ohne CSP, weil Vite/React-Fast-Refresh Inline-Bootstrap benötigt.
- GitHub Pages kann keine HTTP-Header setzen. Deshalb ist die CSP als `<meta>`-Tag eingebaut.
  `frame-ancestors`, `report-uri` und `sandbox` werden in Meta-CSPs von Browsern ignoriert; wer
  Clickjacking-Schutz auf Header-Ebene braucht, sollte die Seite zusätzlich hinter einen
  CDN-/Proxy-Anbieter mit eigenen Response-Headern legen.

Der Workflow nutzt ausschließlich kostenlose GitHub-Funktionen. Es wird keine Datenbank, kein
Server und kein kostenpflichtiger Hosting-Dienst vorausgesetzt.

---

## Bedienung

1. **01 · KI verbinden** – OpenAI-Schlüssel oder kompatiblen Endpoint eintragen; optional testen.
2. **02 · Persönliche Informationen** – Kontakt- und Berufsdaten eingeben. Browser-Autofill
   funktioniert über die Standard-Autocomplete-Tokens. Pflicht für die Generierung sind Vorname,
   Nachname, eine gültige E-Mail-Adresse und mindestens eine berufliche Angabe (oder ein
   Lebenslauf-PDF).
3. **03 · Lebenslauf hochladen** – optional ein PDF bis 10 MB auswählen. Es werden maximal 15
   Seiten und 50.000 Zeichen lokal extrahiert. Passwortgeschützte und reine Scan-PDFs liefern
   keinen Text; dann bitte die Felder manuell ausfüllen.
4. **04 · Stellenanzeige** – URL auslesen lassen oder Text einfügen. Viele Jobportale blockieren
   direkte Browser-Requests (CORS); der Text-Weg ist der zuverlässigste. Anschließend optional
   **Analysieren**, um Unternehmen, Rolle, Anforderungen und Aufgaben zu extrahieren. Die Felder
   sind editierbar.
5. **05 · Dokumente generieren** – beide Dokumente zusammen, einzeln oder die optionale
   Bewerbungs-E-Mail. Die Auto-Löschung ist standardmäßig aktiv.
6. **06 · Ergebnisse** – Text direkt bearbeiten, PDF/TXT exportieren. Die Ergebnisse werden nicht
   gespeichert; vor dem Neuladen exportieren.
7. **Alle Daten jetzt löschen** – im Header oder im Datenschutzbereich; mit Bestätigungsdialog.

Die Anzeige der Stellenanzeige wird nicht automatisch analysiert, damit keine unerwarteten
API-Kosten entstehen. Die Analyse startet erst auf Klick.

---

## Architektur

```
src/
├─ App.tsx                     Orchestrierung: Generierung, Analyse, Export, Löschung
├─ main.tsx                    React-Entry
├─ index.css                   Tailwind-Theme, Komponentenklassen, Animationen
├─ components/
│  ├─ AiConnectionCard.tsx     Provider-Auswahl, Schlüssel-Handling, OAuth-Hinweis
│  ├─ ProfileCard.tsx          Autofill-fähiges Profilformular
│  ├─ ResumeCard.tsx           PDF-Upload und lokale Vorschau
│  ├─ JobCard.tsx              URL/Text, Analyse, editierbare Stellenfelder
│  ├─ GenerateCard.tsx         Aktionen, Auto-Löschung, Fortschritt
│  ├─ ResultsCard.tsx          Editor, Dokument-Tabs, Exporte
│  ├─ PrivacySection.tsx       Datenschutz-Erklärung und Wipe-Button
│  └─ …                        Hero, Header, Dialog, Toast, UI-Primitives
├─ hooks/
│  ├─ useSession.ts            kompletter In-Memory-State + Wipe-Operationen
│  └─ useNotice.ts             transiente Statusmeldungen
└─ lib/
   ├─ ai/
   │  ├─ openai.ts             Responses-API + Chat-Completions-Provider
   │  ├─ prompts.ts            deutsche System-/User-Prompts
   │  ├─ jobAnalysis.ts        defensives JSON-Parsing
   │  └─ types.ts              AiProvider-Interface, AiError
   ├─ job/fetchJob.ts          URL-Fetch, JSON-LD, lesbare Textextraktion
   ├─ resume/pdfText.ts        pdf.js-Worker und Textextraktion
   ├─ pdf/buildPdf.ts          A4-Layout mit Seitenumbrüchen
   ├─ exportDocuments.ts       PDF/TXT-Downloads
   ├─ validation.ts            Pflichtfeld- und Plausibilitätsprüfung
   └─ types.ts                 Domänentypen, Limits, Defaults
```

### Weitere KI-Anbieter ergänzen

1. In `src/lib/ai/` eine Klasse implementieren, die `AiProvider` erfüllt:

   ```ts
   import type { AiProvider, AiRequest } from './types';

   export class MyProvider implements AiProvider {
     readonly label = 'Mein Anbieter';
     async complete(request: AiRequest): Promise<string> {
       // request.system + request.user senden, reinen Text zurückgeben
     }
   }
   ```

2. In `createProvider()` in `src/lib/ai/openai.ts` einen neuen `ProviderKind` abbilden und die
   Konfiguration in `src/lib/types.ts` erweitern.
3. In `AiConnectionCard.tsx` die Auswahl und die passenden Felder ergänzen.
4. Das Prompt- und Export-Layer bleibt unverändert. Der Schlüssel darf weiterhin nur im
   Arbeitsspeicher liegen.

Der OpenAI-Provider nutzt bewusst die **Responses API** (`/responses`) mit `store: false`. Der
Endpoint-Provider nutzt die weiter verbreitete **Chat-Completions**-Form
(`/chat/completions`), damit auch lokale oder alternative Anbieter funktionieren. Fehler werden
typisiert (`AiError`), Schlüssel und Bearer-Tokens aus Fehlermeldungen entfernt.

### Warum keine Web-Crypto-Verschlüsselung?

Die App speichert nichts, was eine Verschlüsselung at rest benötigen würde: keine Persistenz,
keine Dateien, keine Datenbank. Ein Passwortschutz des Arbeitsspeichers wäre nur eine zusätzliche
Hürde ohne echten Sicherheitsgewinn, solange der Schlüssel im selben Tab zum Entschlüsseln
vorliegt. Deshalb wird die Web Crypto API nicht verwendet. Der API-Schlüssel verlässt den Browser
nur in den HTTPS-Request an den gewählten Anbieter.

---

## Sicherheit

- **Keine eingebetteten Secrets.** Weder Quellcode noch Build enthalten API-Schlüssel.
- **Keine Persistenz sensibler Daten.** Nur React-State; keine Storage-APIs.
- **Schlüssel-Handling.** Passwortfeld mit Sichtbarkeits-Toggle, `autocomplete="off"`, keine
  Ausgabe in Logs, keine Aufnahme in Fehlermeldungen (Redaktion von `sk-…`/`rk-…`).
- **XSS.** KI- und Nutzertexte werden ausschließlich als Text gerendert (Textarea, `pre`), nie
  per `dangerouslySetInnerHTML`. Job-HTML wird nur mit `DOMParser` geparst und als Text
  extrahiert; Skripte werden vorher entfernt.
- **Prompt Injection.** Prompt-Texte markieren Stellenanzeige und Lebenslauf ausdrücklich als
  Datenquelle und ignorieren darin enthaltene Anweisungen.
- **Eingabevalidierung.** Längenlimits für alle Felder, E-Mail-Prüfung, Dateigröße/-typ,
  URL-Protokolle, defensive KI-Antwortparser.
- **Netzwerk.** KI-Requests nur per HTTPS bzw. localhost-HTTP; Job-URLs nur http(s); `credentials:
  omit`, `referrerPolicy: no-referrer` beim Stellen-Fetch.
- **CSP im Produktionsbuild:**

  ```
  default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob:; font-src 'self' data:;
  connect-src 'self' https: http://localhost:* http://127.0.0.1:*;
  worker-src 'self' blob:; object-src 'none'; base-uri 'none';
  form-action 'self'; frame-src 'none'; media-src 'none'; manifest-src 'self'
  ```

  `style-src 'unsafe-inline'` ist für React-Inline-Styles und das PDF-Theme nötig.
  `connect-src https:` ist für Stellen-URLs und frei wählbare KI-Endpoints nötig.
- **Kein Tracking.** Es werden keine Analyse-, Fehler- oder Marketing-Skripte geladen.
- **Keine Daten in Konsolen.** Der Quellcode enthält keine `console`-Aufrufe mit Nutzerdaten;
  Fehler werden als verständliche UI-Meldungen behandelt.

---

## Grenzen und ehrliche Hinweise

- **Kein ChatGPT-OAuth in dieser Hosting-Form.** Siehe oben. Der UI-Hinweis ist keine
  Design-Deko, sondern der aktuelle technische Stand.
- **Kein garantiert kostenloser KI-Zugriff.** Ein ChatGPT-Abo hilft hier nicht. Die API kostet
  separat; ein eigener Endpoint kann kostenlos sein, wenn du ihn selbst betreibst.
- **Stellen-URLs sind oft nicht lesbar.** Portale wie große Jobbörsen blocken Browser-Requests
  oder liefern nur dynamische Inhalte. Der Text-Fallback ist bewusst gleichwertig.
- **KIs können irren.** Die Prompts verbieten Erfindungen, aber ein Modell kann trotzdem falsch
  formulieren. Prüfe jede Aussage, jeden Zeitraum und jede Anforderung vor dem Versand.
- **PDF-Scans.** Ohne Textebene gibt es nichts zu extrahieren. Dann manuell eingeben.
- **PDF-Layout.** Der Export nutzt eingebaute Helvetica-Schriften mit WinAnsi-Zeichensatz. Umlaute,
  ß und Euro funktionieren; außergewöhnliche Sonderzeichen oder eingebettete Schriften werden
  bewusst vermieden. Aufzählungen und lange Texte werden automatisch umbrochen; sehr lange
  Wörter werden zeichenweise getrennt.
- **Kein Speichern/Wiederherstellen.** Ein Reload ist endgültig. Der Browser zeigt beim Schließen
  eine Warnung, solange Daten vorhanden sind.
- **Content-Security-Policy als Meta-Tag.** GitHub Pages erlaubt keine eigenen HTTP-Header.
  Meta-CSPs können u. a. `frame-ancestors` nicht setzen.
- **Browser-Schlüssel.** Die komfortabelste Variante ist nicht die sicherste. Für echte Nutzer
  außerhalb deines Rechners ist ein Proxy (Variante B) die bessere Wahl.

---

## Fehlerbehebung

| Symptom | Ursache / Lösung |
| --- | --- |
| „Der API-Schlüssel wurde abgelehnt“ (401/403) | Schlüssel falsch, Projekt gesperrt oder kein Guthaben. Key neu erzeugen und in den Projekt-Einstellungen prüfen. |
| „Kontingent erschöpft / Rate-Limit“ (429) | Guthaben oder Rate-Limit beim Anbieter prüfen; kurz warten. |
| „Endpoint oder Modell nicht gefunden“ (404) | Basis-URL prüfen (meist `/v1`), Modellname exakt übernehmen. |
| „Der KI-Anbieter ist nicht erreichbar“ | Internet, CORS des Endpoints und HTTPS prüfen. Bei eigenem Proxy `Access-Control-Allow-Origin` für die Pages-Origin setzen. |
| Stelle wird nicht ausgelesen | CORS/Portalblockade. Auf „Text einfügen“ wechseln. Das ist der stabile Weg. |
| PDF wird nicht gelesen | Datei größer als 10 MB, passwortgeschützt, beschädigt oder ein Scan ohne Textebene. |
| Leere PDF-Exporte | Der Editor ist leer. Text eingeben oder neu generieren. |
| PDF-Export startet nicht | Popup-/Download-Blocker prüfen; der Download wird als Blob ausgelöst. |
| Verbindungstest schlägt fehl, Generierung auch | Erst Modell/Key prüfen; Modellnamen ändern sich. Die Fehlermeldung enthält den Anbieter-Hinweis. |
| Custom Endpoint im LAN funktioniert nicht | CSP erlaubt HTTP nur für localhost. Nutze HTTPS oder einen lokalen Tunnel/Proxy. |
| Eingaben sind nach der Generierung weg | Die Auto-Löschung war aktiv (Standard). Das ist beabsichtigt; beide Dokumente vorher zusammen erzeugen. |
| Alles ist nach Reload weg | Es gibt bewusst keine Persistenz. Vorher exportieren. |

---

## Technischer Stack

React 19, TypeScript, Vite 7, Tailwind CSS 4, jsPDF 4, pdf.js 6, GitHub Actions/GitHub Pages.
Keine UI-, Icon-, State- oder Analytics-Bibliotheken darüber hinaus.
