import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/**
 * The CSP is injected only into the production build. Vite's dev server and
 * React Fast Refresh need inline bootstrap code, which a strict script-src
 * would block. Production output has no inline scripts.
 *
 * `connect-src https:` is required because:
 *  - the user's job-posting URL is fetched directly by the browser,
 *  - AI requests go either to api.openai.com or to a user-supplied,
 *    OpenAI-compatible endpoint.
 * `worker-src blob:` is used by the PDF text extractor.
 */
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' https: http://localhost:* http://127.0.0.1:*",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'self'",
  "frame-src 'none'",
  "media-src 'none'",
  "manifest-src 'self'",
].join('; ');

function contentSecurityPolicyPlugin(): Plugin {
  return {
    name: 'applycraft-csp',
    apply: 'build',
    transformIndexHtml(html) {
      return html.replace(
        '</head>',
        `  <meta http-equiv="Content-Security-Policy" content="${CONTENT_SECURITY_POLICY}" />\n  </head>`,
      );
    },
  };
}

export default defineConfig({
  // relative base keeps the build portable for GitHub Pages project sites
  base: './',
  plugins: [react(), tailwindcss(), contentSecurityPolicyPlugin()],
  build: {
    modulePreload: {
      // no inline module-preload polyfill, so script-src 'self' stays valid
      polyfill: false,
    },
  },
});
