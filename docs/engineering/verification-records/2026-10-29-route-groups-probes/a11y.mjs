import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
const WT = process.env.WORKTREE ?? process.cwd(); // the repository root of the worktree under test
const require = createRequire(WT + '/apps/web/package.json');
const { chromium } = require('@playwright/test');
const env = Object.fromEntries(
  execSync('supabase status -o env --workdir .', {
    cwd: WT,
    stdio: ['ignore', 'pipe', 'ignore'],
  })
    .toString()
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, '')];
    }),
);
const API = env.API_URL,
  SR = env.SERVICE_ROLE_KEY;
const email = `route-groups-verify-${Date.now()}@example.test`,
  password = `Aa1!${Math.random().toString(36).slice(2)}xyZ`;
const user = await (
  await fetch(API + '/auth/v1/admin/users', {
    method: 'POST',
    headers: {
      apikey: SR,
      Authorization: 'Bearer ' + SR,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: { name: 'Route Verify' },
    }),
  })
).json();
const B = 'http://127.0.0.1:3000';
const b = await chromium.launch();
const out = [];
const probe = async (p) =>
  p.evaluate(() => {
    const vw = window.innerWidth;
    const over = document.documentElement.scrollWidth - vw;
    const wide = [...document.querySelectorAll('body *')]
      .filter((e) => {
        const r = e.getBoundingClientRect();
        return r.width > 0 && r.right > vw + 1;
      })
      .slice(0, 3)
      .map((e) => e.tagName + '.' + String(e.className).slice(0, 40));
    const main = document.querySelector('main');
    const col = main
      ? [...main.querySelectorAll('p,h1,form,[data-slot=card]')].map((e) =>
          Math.round(e.getBoundingClientRect().width),
        )
      : [];
    const cardRect = document
      .querySelector('main [data-slot=card]')
      ?.getBoundingClientRect();
    return {
      overflowPx: over,
      wideEls: wide,
      maxContentW: col.length ? Math.max(...col) : null,
      card: cardRect
        ? {
            left: Math.round(cardRect.left),
            right: Math.round(vw - cardRect.right),
          }
        : null,
      banner: document.querySelectorAll('header,[role=banner]').length,
      mains: document.querySelectorAll('main').length,
    };
  });
const tabTrace = async (p, n = 14) => {
  const trace = [];
  await p.evaluate(
    () => document.activeElement && document.activeElement.blur(),
  );
  for (let i = 0; i < n; i++) {
    await p.keyboard.press('Tab');
    trace.push(
      await p.evaluate(() => {
        const e = document.activeElement;
        if (!e || e === document.body) return 'BODY';
        const cs = getComputedStyle(e);
        const r = e.getBoundingClientRect();
        const ring =
          (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) ||
          (cs.boxShadow && cs.boxShadow !== 'none');
        const name = (
          e.getAttribute('aria-label') ||
          e.labels?.[0]?.textContent ||
          e.textContent ||
          e.getAttribute('name') ||
          ''
        )
          .trim()
          .replace(/\s+/g, ' ')
          .slice(0, 28);
        return `${e.tagName.toLowerCase()}[${name}]${ring ? '' : ' NO-RING'}${r.width === 0 ? ' HIDDEN' : ''}`;
      }),
    );
  }
  return trace;
};
try {
  for (const [label, vp] of [
    ['phone 360', { width: 360, height: 740 }],
    ['desktop 1280', { width: 1280, height: 800 }],
  ]) {
    const anon = await (await b.newContext({ viewport: vp })).newPage();
    for (const path of [
      '/',
      '/privacy',
      '/auth/login',
      '/auth/register',
      '/auth/forgot-password',
      '/auth/error?reason=reset',
    ]) {
      await anon.goto(B + path);
      await anon.waitForLoadState('networkidle');
      out.push({
        vp: label,
        path,
        ...(await probe(anon)),
        tab: (await tabTrace(anon, path === '/privacy' ? 5 : 12)).join(' > '),
      });
    }
    const ctx = await b.newContext({ viewport: vp });
    const s = await ctx.newPage();
    await s.goto(B + '/auth/login');
    await s.fill('input[name=email]', email);
    await s.fill('input[name=password]', password);
    await s.getByRole('button', { name: 'Sign in', exact: true }).click();
    await s.waitForURL(/\/home/);
    for (const path of [
      '/auth/welcome',
      '/auth/update-password',
      '/auth/delete-account',
      '/privacy',
    ]) {
      await s.goto(B + path);
      await s.waitForLoadState('networkidle');
      out.push({
        vp: label + ' signed-in',
        path,
        ...(await probe(s)),
        tab: (await tabTrace(s, 10)).join(' > '),
      });
    }
    // form errors: empty login + empty register
    const f = await (await b.newContext({ viewport: vp })).newPage();
    await f.goto(B + '/auth/login');
    await f.getByRole('button', { name: 'Sign in', exact: true }).click();
    await f.waitForTimeout(600);
    out.push({
      vp: label,
      path: 'login empty submit',
      errors: await f.evaluate(() =>
        [
          ...document.querySelectorAll(
            '[role=alert],[aria-invalid=true],[data-slot=field-error],p[id$=-error]',
          ),
        ].map(
          (e) =>
            `${e.tagName}${e.getAttribute('role') ? '[role=' + e.getAttribute('role') + ']' : ''}${e.getAttribute('aria-invalid') ? '[invalid]' : ''}:${(e.textContent || '').trim().slice(0, 50)}${e.getAttribute('aria-describedby') ? ' described-by=' + e.getAttribute('aria-describedby').slice(0, 20) : ''}`,
        ),
      ),
      focused: await f.evaluate(
        () =>
          document.activeElement?.getAttribute('name') ||
          document.activeElement?.tagName,
      ),
    });
    await f.goto(B + '/auth/register');
    await f.getByRole('button', { name: 'Create account' }).click();
    await f.waitForTimeout(600);
    out.push({
      vp: label,
      path: 'register empty submit',
      errors: await f.evaluate(() =>
        [...document.querySelectorAll('[role=alert],[aria-invalid=true]')].map(
          (e) =>
            `${e.tagName}${e.getAttribute('role') ? '[role=' + e.getAttribute('role') + ']' : ''}${e.getAttribute('aria-invalid') ? '[invalid]' : ''}:${(e.textContent || '').trim().slice(0, 50)}`,
        ),
      ),
    });
  }
} finally {
  await fetch(API + '/auth/v1/admin/users/' + user.id, {
    method: 'DELETE',
    headers: { apikey: SR, Authorization: 'Bearer ' + SR },
  });
  await b.close();
}
writeFileSync(
  '/tmp/claude-501/pw/a11y-result.json',
  JSON.stringify(out, null, 1),
);
for (const r of out) console.log(JSON.stringify(r));
