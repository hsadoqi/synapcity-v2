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
  SR = env.SERVICE_ROLE_KEY,
  MAIL = env.MAILPIT_URL;
const email = `route-groups-verify-${Date.now()}@example.test`;
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
      password: 'Aa1!xxxxxxxxx',
      email_confirm: true,
    }),
  })
).json();
const b = await chromium.launch();
const p = await b.newPage();
try {
  await p.goto('http://127.0.0.1:3000/auth/forgot-password');
  await p.fill('input[name=email]', email);
  await p.getByRole('button', { name: 'Send reset link' }).click();
  await p.waitForTimeout(2500);
  const { messages } = await (
    await fetch(
      `${MAIL}/api/v1/search?query=${encodeURIComponent('to:' + email)}`,
    )
  ).json();
  console.log('mails', messages.length);
  if (messages[0]) {
    const m = await (
      await fetch(`${MAIL}/api/v1/message/${messages[0].ID}`)
    ).json();
    const l = m.Text.match(
      /https?:\/\/[^\s"<>)]+\/auth\/v1\/verify[^\s"<>)]*/,
    )[0];
    const u = new URL(l);
    console.log(
      'verify host',
      u.host,
      'type',
      u.searchParams.get('type'),
      'redirect_to',
      u.searchParams.get('redirect_to'),
    );
  }
  console.log(await p.evaluate(() => document.body.innerText.slice(0, 200)));
} finally {
  await fetch(
    `${MAIL}/api/v1/search?query=${encodeURIComponent('to:' + email)}`,
    { method: 'DELETE' },
  );
  await fetch(API + '/auth/v1/admin/users/' + user.id, {
    method: 'DELETE',
    headers: { apikey: SR, Authorization: 'Bearer ' + SR },
  });
  await b.close();
}
