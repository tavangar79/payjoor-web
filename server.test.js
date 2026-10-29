// Website server tests (PRD §7.3): redirects, direct legal pages, deletion status, assets. `npm test -w web`.
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { after, describe, it } from 'node:test';
import { createSite, fillTemplate } from './server.js';

function fakeDist() {
  const dir = mkdtempSync(path.join(tmpdir(), 'web-dist-'));
  mkdirSync(path.join(dir, 'client/assets'), { recursive: true });
  mkdirSync(path.join(dir, 'server'));
  writeFileSync(
    path.join(dir, 'client/index.html'),
    '<html lang="<!--lang-->" dir="<!--dir-->"><title><!--title--></title><div id="root"><!--app-html--></div><!--ssr-data--></html>',
  );
  writeFileSync(path.join(dir, 'client/assets/app-abc.css'), 'body{}');
  writeFileSync(
    path.join(dir, 'server/entry-server.js'),
    `export function render(url, data = {}) {
      const locale = url.startsWith('/en') ? 'en' : 'fa';
      const known = /^\\/(fa|en)(\\/(privacy|terms|data-deletion(\\/status)?))?\\/?(\\?.*)?$/.test(url);
      return { html: '<main>' + url + ' ' + JSON.stringify(data) + '</main>', lang: locale, dir: locale === 'fa' ? 'rtl' : 'ltr',
        title: 'T & <x>', status: known ? 200 : 404 };
    }`,
  );
  return dir;
}

const servers = [];
after(() => servers.forEach((s) => s.close()));

/** Starts a site on a free port and returns a fetch bound to it (redirects not followed). */
async function site(overrides = {}, dist = fakeDist()) {
  const app = createSite({ contactEmail: 'test@example.com', deletionStatus: async () => null, ...overrides }, dist);
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  servers.push(server);
  const base = `http://127.0.0.1:${server.address().port}`;
  return (url, headers = {}) => fetch(base + url, { headers, redirect: 'manual' });
}

describe('website server', () => {
  it('redirects / by Accept-Language, default fa', async () => {
    const get = await site();
    assert.equal((await get('/')).headers.get('location'), '/fa');
    assert.equal((await get('/', { 'Accept-Language': 'en-US,en;q=0.9' })).headers.get('location'), '/en');
    assert.equal((await get('/', { 'Accept-Language': 'fa-IR,en;q=0.5' })).headers.get('location'), '/fa');
  });

  it('renders legal pages directly (200, no redirect) with lang, dir, escaped title and a CSP', async () => {
    const get = await site();
    const res = await get('/en/privacy', { 'User-Agent': 'facebookexternalhit/1.1' });
    assert.equal(res.status, 200);
    const text = await res.text();
    assert.ok(text.includes('<html lang="en" dir="ltr">'));
    assert.ok(text.includes('<title>T &amp; &lt;x&gt;</title>'));
    assert.ok(text.includes('<main>/en/privacy {"contactEmail":"test@example.com"}</main>'));
    assert.equal(res.headers.get('cache-control'), 'no-cache');
    assert.ok(res.headers.get('content-security-policy').includes("frame-ancestors 'none'"));
    assert.ok((await (await get('/fa/terms')).text()).includes('dir="rtl"'));
    assert.equal((await get('/en/nope')).status, 404);
  });

  it('passes the deletion status from the backend to the status page', async () => {
    const get = await site({ deletionStatus: async (code) => (code === 'abc' ? 'done' : null) });
    const res = await get('/en/data-deletion/status?code=abc');
    assert.ok(
      (await res.text()).includes(
        '<script id="ssr-data" type="application/json">{"contactEmail":"test@example.com","deletionStatus":"done"}</script>',
      ),
    );
    assert.equal(res.headers.get('cache-control'), 'no-store');
    assert.ok((await (await get('/en/data-deletion/status?code=nope')).text()).includes('"deletionStatus":null'));
  });

  it('answers 503 when the backend cannot give the status', async () => {
    const get = await site({ deletionStatus: async () => Promise.reject(new Error('down')) });
    assert.equal((await get('/en/data-deletion/status?code=abc')).status, 503);
  });

  it('serves hashed assets with long caching, and says clearly when the build is missing', async () => {
    const get = await site();
    const css = await get('/assets/app-abc.css');
    assert.equal(css.status, 200);
    assert.ok(css.headers.get('cache-control').includes('immutable'));
    const missing = await (await site({}, path.join(tmpdir(), 'no-such-web-dist')))('/en');
    assert.equal(missing.status, 503);
    assert.ok((await missing.text()).includes('npm run build -w web'));
  });

  it('keeps </script> in data from closing the tag', () => {
    const html = fillTemplate('<!--ssr-data-->', { html: '', lang: 'en', dir: 'ltr', title: '', status: 200 }, { x: '</script><b>' });
    assert.ok(!html.includes('</script><b>'));
    assert.ok(html.includes('\\u003c/script>'));
  });
});
