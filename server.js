// Website server (PRD §7, §11): server-renders the built app in dist/. `/` redirects by Accept-Language
// (default fa); `/fa/...` and `/en/...` render directly with no redirects, as Meta's checks need (§7.3).
// Runs on its own; the only thing it asks the backend for is a data-deletion request's status.
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import express from 'express';

export const DEFAULT_DIST = fileURLToPath(new URL('./dist', import.meta.url));

// Our pages load only their own built scripts, styles and fonts. Nothing here blocks crawlers or bots:
// Meta's reviewers and `facebookexternalhit` must reach the pages (§7.3, §12).
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

const escapeHtml = (s) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
// JSON inside <script>: escape `<` so the data can't close the tag.
const scriptJson = (data) => JSON.stringify(data).replace(/</g, '\\u003c');

export function fillTemplate(template, page, data) {
  return template
    .replace('<!--lang-->', page.lang)
    .replace('<!--dir-->', page.dir)
    .replace('<!--title-->', escapeHtml(page.title))
    .replace('<!--app-html-->', () => page.html)
    .replace('<!--ssr-data-->', () => `<script id="ssr-data" type="application/json">${scriptJson(data)}</script>`);
}

/** Reads a deletion request's status from the backend's public API; null for an unknown code. */
export function backendDeletionStatus(apiUrl) {
  return async (code) => {
    const url = new URL('/api/deletion-status', apiUrl);
    url.searchParams.set('code', code);
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`deletion status: HTTP ${res.status}`);
    return (await res.json()).status ?? null;
  };
}

/**
 * options: contactEmail (required), instagramHandle, companyName, deletionStatus(code), production.
 * Every page gets the contact email (legal pages must show it, §7.3), plus the handle and company name
 * when set; the status page also gets the status.
 */
export function createSite(options, dist = DEFAULT_DIST) {
  const app = express();
  app.disable('x-powered-by');

  app.use((_req, res, next) => {
    res.set({
      'Content-Security-Policy': CSP,
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'X-Frame-Options': 'DENY',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    });
    if (options.production) res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
  });

  app.get('/healthz', (_req, res) => {
    res.json({ ok: true });
  });

  let loaded;
  const load = () =>
    (loaded ??= Promise.all([
      import(pathToFileURL(path.join(dist, 'server/entry-server.js')).href),
      readFile(path.join(dist, 'client/index.html'), 'utf8'),
    ])
      .then(([server, template]) => ({ server, template }))
      .catch((err) => {
        loaded = undefined;
        throw err;
      }));

  // Hashed build assets can be cached forever; index.html is never served as a static file.
  app.use('/assets', express.static(path.join(dist, 'client/assets'), { immutable: true, maxAge: '1y', index: false }));
  app.use(express.static(path.join(dist, 'client'), { index: false, maxAge: '1d' }));

  app.get('/', (req, res) => {
    res.vary('Accept-Language').redirect(302, req.acceptsLanguages('fa', 'en') === 'en' ? '/en' : '/fa');
  });

  app.get(/.*/, async (req, res) => {
    let web;
    try {
      web = await load();
    } catch (err) {
      console.error(`web build missing in ${dist}: run npm run build -w web (${err instanceof Error ? err.message : err})`);
      res.status(503).type('text/plain').send('Website build not found. Run `npm run build -w web`.');
      return;
    }

    const data = { contactEmail: options.contactEmail };
    if (options.instagramHandle) data.instagramHandle = options.instagramHandle;
    if (options.companyName) data.companyName = options.companyName;
    if (/^\/(fa|en)\/data-deletion\/status\/?$/.test(req.path)) {
      const code = typeof req.query.code === 'string' ? req.query.code : '';
      try {
        data.deletionStatus = code ? await options.deletionStatus(code) : null;
      } catch (err) {
        console.error(err instanceof Error ? err.message : err);
        res.status(503).set('Cache-Control', 'no-store').type('text/plain').send('Status unavailable, please try again shortly.');
        return;
      }
    }

    const page = web.server.render(req.originalUrl, data);
    res
      .status(page.status)
      .set('Cache-Control', 'deletionStatus' in data ? 'no-store' : 'no-cache')
      .type('html')
      .send(fillTemplate(web.template, page, data));
  });

  return app;
}

// `npm start`: config from the environment (template: .env.example).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { PORT = '3001', API_URL = 'http://localhost:3000', CONTACT_EMAIL, NODE_ENV } = process.env;
  if (!CONTACT_EMAIL) {
    console.error('CONTACT_EMAIL is required (legal pages must show it, PRD §7.3)');
    process.exit(1);
  }
  const app = createSite({
    contactEmail: CONTACT_EMAIL,
    instagramHandle: process.env.SITE_INSTAGRAM_HANDLE?.trim().replace(/^@/, '') || undefined,
    companyName: process.env.COMPANY_NAME?.trim() || undefined,
    deletionStatus: backendDeletionStatus(API_URL),
    production: NODE_ENV === 'production',
  });
  const server = app.listen(Number(PORT), () => console.log(`website listening on ${PORT}`));
  for (const signal of ['SIGTERM', 'SIGINT']) process.once(signal, () => server.close(() => process.exit(0)));
}
