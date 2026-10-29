import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
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
if (!/^http:\/\/(127\.0\.0\.1|localhost):/.test(API))
  throw new Error('not local');
const email = `route-groups-verify-${Date.now()}@example.test`,
  password = `Aa1!${Math.random().toString(36).slice(2)}xyZ`;
const r = await fetch(API + '/auth/v1/admin/users', {
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
});
const user = await r.json();
console.log('created', r.status, user.id);
const b = await chromium.launch();
const ctx = await b.newContext();
const p = await ctx.newPage();
const B = 'http://127.0.0.1:3000';
const shell = async () =>
  p.evaluate(() => ({
    url: location.pathname + location.search,
    shells: [...document.querySelectorAll('[data-slot$="-shell"]')].map((e) =>
      e.getAttribute('data-slot'),
    ),
    mains: document.querySelectorAll('main').length,
    h1: document.querySelector('h1')?.textContent,
    menu: !!document.querySelector(
      '[aria-label="Account menu"],button[aria-label*="ccount"]',
    ),
    cls: document.documentElement.className.slice(0, 40),
  }));
try {
  await p.goto(B + '/auth/login');
  await p.fill('input[name=email]', email);
  await p.fill('input[name=password]', password);
  await p.getByRole('button', { name: 'Sign in', exact: true }).click();
  await p.waitForURL(/\/home/, { timeout: 20000 });
  console.log('after login', JSON.stringify(await shell()));
  const id = user.id;
  for (const path of [
    '/',
    '/privacy',
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/auth/welcome',
    '/auth/update-password',
    '/auth/delete-account',
    '/auth/error',
    `/${id}`,
    `/${id}/settings`,
    '/nope',
    `/${id}/home/spaces/00000000-0000-0000-0000-000000000000`,
    `/someone-else/home`,
  ]) {
    const resp = await p.goto(B + path);
    console.log(path, resp.status(), JSON.stringify(await shell()));
  }
  console.log(
    'cookies',
    (await ctx.cookies())
      .map(
        (c) =>
          `${c.name.replace(/(sb-[^-]+).*/, '$1…')} httpOnly=${c.httpOnly} sameSite=${c.sameSite} secure=${c.secure} path=${c.path}`,
      )
      .join(' | '),
  );
} finally {
  const d = await fetch(API + '/auth/v1/admin/users/' + user.id, {
    method: 'DELETE',
    headers: { apikey: SR, Authorization: 'Bearer ' + SR },
  });
  console.log('deleted', d.status);
  await b.close();
}
