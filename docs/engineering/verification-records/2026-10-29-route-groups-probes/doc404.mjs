import { createRequire } from 'node:module';
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
    body: JSON.stringify({ email, password, email_confirm: true }),
  })
).json();
const b = await chromium.launch();
const ctx = await b.newContext();
const p = await ctx.newPage();
try {
  await p.goto('http://127.0.0.1:3000/auth/login');
  await p.fill('input[name=email]', email);
  await p.fill('input[name=password]', password);
  await p.getByRole('button', { name: 'Sign in', exact: true }).click();
  await p.waitForURL(/\/home/);
  for (let i = 0; i < 6; i++) {
    const path = `/${user.id}/home/documents/00000000-0000-0000-0000-00000000000${i}`;
    const r = await p.goto('http://127.0.0.1:3000' + path);
    const raw = await r.text();
    const dom = await p.evaluate(() => ({
      shells: [...document.querySelectorAll('[data-slot$="-shell"]')].length,
      htmlClass: document.documentElement.className.length,
      len: document.documentElement.outerHTML.length,
    }));
    console.log(
      i,
      r.status(),
      'raw',
      raw.length,
      raw.includes('data-slot="authenticated-shell"'),
      raw.includes('We could not find'),
      JSON.stringify(dom),
    );
    if (!dom.shells) console.log(raw.slice(0, 400));
  }
} finally {
  await fetch(API + '/auth/v1/admin/users/' + user.id, {
    method: 'DELETE',
    headers: { apikey: SR, Authorization: 'Bearer ' + SR },
  });
  await b.close();
}
