import { createRequire } from 'node:module';
const require = createRequire(
  '/Users/hanaasadoqi/Projects/worktrees/synapcity/refactors/route-group-followup/apps/web/package.json',
);
const { chromium } = require('@playwright/test');
const b = await chromium.launch();
const p = await b.newPage();
for (const path of ['/auth/register', '/auth/login', '/auth/forgot-password']) {
  await p.goto('http://127.0.0.1:3000' + path);
  console.log('==', path);
  console.log(
    await p.evaluate(() =>
      [...document.querySelectorAll('input,button,a,h1,h2')]
        .map(
          (e) =>
            `${e.tagName}:${e.getAttribute('type') || ''}:${(e.getAttribute('aria-label') || e.labels?.[0]?.textContent || e.textContent || '').trim().slice(0, 40)}:${e.getAttribute('name') || e.getAttribute('href') || ''}`,
        )
        .join('\n'),
    ),
  );
}
await b.close();
