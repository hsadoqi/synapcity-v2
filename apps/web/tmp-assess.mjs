import { chromium } from '@playwright/test';
const BASE = 'http://localhost:8080';
const paths = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/error?reason=confirm',
];
const analyze = () => {
  const cv = document
    .createElement('canvas')
    .getContext('2d', { willReadFrequently: true });
  const rgba = (c) => {
    cv.clearRect(0, 0, 1, 1);
    cv.fillStyle = '#000';
    cv.fillStyle = c;
    cv.fillRect(0, 0, 1, 1);
    const d = cv.getImageData(0, 0, 1, 1).data;
    // alpha-aware: draw on transparent
    cv.clearRect(0, 0, 1, 1);
    cv.fillStyle = c;
    cv.fillRect(0, 0, 1, 1);
    const e = cv.getImageData(0, 0, 1, 1).data;
    return [e[0], e[1], e[2], e[3] / 255];
  };
  const lum = ([r, g, b]) => {
    const f = (v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const cr = (a, b) => {
    const x = lum(a),
      y = lum(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  };
  const over = (top, bot) => {
    const a = top[3];
    return [0, 1, 2].map((i) => top[i] * a + bot[i] * (1 - a)).concat([1]);
  };
  const bgOf = (el) => {
    const chain = [];
    for (let e = el; e; e = e.parentElement) chain.push(e);
    let bg = [255, 255, 255, 1];
    const root = getComputedStyle(document.documentElement).backgroundColor;
    const rb = rgba(root);
    if (rb[3] > 0) bg = over(rb, [255, 255, 255, 1]);
    for (const e of chain.reverse()) {
      const c = rgba(getComputedStyle(e).backgroundColor);
      if (c[3] > 0) bg = over(c, bg);
    }
    return bg;
  };
  const vis = (el) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return (
      r.width > 0 &&
      r.height > 0 &&
      s.visibility !== 'hidden' &&
      s.display !== 'none' &&
      +s.opacity > 0
    );
  };
  const out = {};
  out.overflow = {
    sw: document.documentElement.scrollWidth,
    cw: document.documentElement.clientWidth,
  };
  out.h1 = document.querySelectorAll('h1').length;
  const touch = matchMedia('(pointer:coarse)').matches;
  out.small = [];
  for (const el of document.querySelectorAll(
    'a[href],button,input,select,textarea,[role=button],[tabindex]',
  )) {
    if (!vis(el) || el.type === 'hidden') continue;
    const r = el.getBoundingClientRect();
    if (r.width < 44 || r.height < 44) {
      out.small.push(
        `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''} "${(el.innerText || el.getAttribute('aria-label') || el.name || '').slice(0, 25)}" ${Math.round(r.width)}x${Math.round(r.height)}`,
      );
    }
  }
  out.contrast = [];
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = w.nextNode())) {
    const t = n.textContent.trim();
    if (!t) continue;
    const el = n.parentElement;
    if (!el || !vis(el) || ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(el.tagName))
      continue;
    const s = getComputedStyle(el);
    const bg = bgOf(el);
    let fg = rgba(s.color);
    // opacity of ancestors
    let op = 1;
    for (let e = el; e; e = e.parentElement) op *= +getComputedStyle(e).opacity;
    fg[3] *= op;
    const f = over(fg, bg);
    const ratio = cr(f, bg);
    const px = parseFloat(s.fontSize);
    const bold = +s.fontWeight >= 700;
    const large = px >= 24 || (px >= 18.66 && bold);
    const need = large ? 3 : 4.5;
    if (ratio < need)
      out.contrast.push(
        `FAIL ${ratio.toFixed(2)}<${need} "${t.slice(0, 30)}" ${el.tagName} ${px}px`,
      );
  }
  out.fields = [...document.querySelectorAll('input,textarea,select')]
    .filter(vis)
    .map((e) => ({
      n: e.name || e.type,
      fs: getComputedStyle(e).fontSize,
      h: Math.round(e.getBoundingClientRect().height),
    }));
  return out;
};
const results = [];
const browser = await chromium.launch();
for (const scheme of ['light', 'dark'])
  for (const vp of ['desk', 'mob']) {
    const opts =
      vp === 'desk'
        ? { viewport: { width: 1280, height: 800 }, colorScheme: scheme }
        : {
            viewport: { width: 375, height: 740 },
            hasTouch: true,
            isMobile: true,
            colorScheme: scheme,
          };
    const ctx = await browser.newContext(opts);
    for (const p of paths) {
      const page = await ctx.newPage();
      const logs = [];
      page.on('console', (m) => {
        if (['error', 'warning'].includes(m.type()))
          logs.push(m.type() + ': ' + m.text().slice(0, 160));
      });
      page.on('pageerror', (e) =>
        logs.push('pageerror: ' + e.message.slice(0, 160)),
      );
      await page.goto(BASE + p, { waitUntil: 'networkidle' });
      await page.waitForTimeout(400);
      const r = await page.evaluate(analyze);
      // filter small by thresholds
      r.under24 = r.small.filter((s) => {
        const m = s.match(/(\d+)x(\d+)$/);
        return +m[1] < 24 || +m[2] < 24;
      });
      if (vp === 'desk') delete r.small;
      else ((r.under44 = r.small), delete r.small);
      r.logs = logs;
      console.log(JSON.stringify({ scheme, vp, p, url: page.url(), ...r }));
      if (vp === 'desk' && p === '/auth/login') {
        const tabs = [];
        for (let i = 0; i < 12; i++) {
          await page.keyboard.press('Tab');
          await page.waitForTimeout(350);
          tabs.push(
            await page.evaluate(() => {
              const cv = document
                .createElement('canvas')
                .getContext('2d', { willReadFrequently: true });
              const rgba = (c) => {
                cv.clearRect(0, 0, 1, 1);
                cv.fillStyle = c;
                cv.fillRect(0, 0, 1, 1);
                const e = cv.getImageData(0, 0, 1, 1).data;
                return [e[0], e[1], e[2], e[3] / 255];
              };
              const lum = ([r, g, b]) => {
                const f = (v) => {
                  v /= 255;
                  return v <= 0.03928
                    ? v / 12.92
                    : ((v + 0.055) / 1.055) ** 2.4;
                };
                return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
              };
              const cr = (a, b) => {
                const x = lum(a),
                  y = lum(b);
                return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
              };
              const over = (t, b) => {
                const a = t[3];
                return [0, 1, 2]
                  .map((i) => t[i] * a + b[i] * (1 - a))
                  .concat([1]);
              };
              const el = document.activeElement;
              const s = getComputedStyle(el);
              const card =
                document.querySelector('[data-slot=card]') ||
                el.closest('main') ||
                document.body;
              let bg = [255, 255, 255, 1];
              for (let e = card, ch = []; ;) {
                ch.push(e);
                if (!e.parentElement) break;
                e = e.parentElement;
                if (!e.parentElement) {
                  ch.push(e);
                }
              }
              const chain = [];
              for (let e = card; e; e = e.parentElement) chain.push(e);
              for (const e of chain.reverse()) {
                const c = rgba(getComputedStyle(e).backgroundColor);
                if (c[3] > 0) bg = over(c, bg);
              }
              let ind = 'none',
                ratio = null;
              if (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0) {
                ind = 'outline ' + s.outlineColor + ' ' + s.outlineWidth;
                const c = rgba(s.outlineColor);
                ratio = cr(over(c, bg), bg);
              } else if (s.boxShadow !== 'none') {
                const cols =
                  s.boxShadow.match(
                    /(rgba?\([^)]*\)|oklch\([^)]*\)|color\([^)]*\))/g,
                  ) || [];
                let best = null;
                for (const c of cols) {
                  const v = rgba(c);
                  if (!best || v[3] > best[3]) best = v;
                }
                if (best) {
                  ind = 'shadow ' + s.boxShadow.slice(0, 80);
                  ratio = cr(over(best, bg), bg);
                }
              }
              return {
                el:
                  el.tagName +
                  (el.name ? '[' + el.name + ']' : '') +
                  ' "' +
                  (el.innerText || el.getAttribute('aria-label') || '').slice(
                    0,
                    18,
                  ) +
                  '"',
                fv: el.matches(':focus-visible'),
                ind,
                ratio: ratio && +ratio.toFixed(2),
              };
            }),
          );
        }
        console.log('TABS', scheme, JSON.stringify(tabs));
        await page.keyboard.press('Escape');
      }
      if (vp === 'desk' && p === '/auth/login') {
        const btn = page.locator('button[type=submit]').first();
        const m = async () =>
          btn.evaluate((b) => {
            const cv = document
              .createElement('canvas')
              .getContext('2d', { willReadFrequently: true });
            const rgba = (c) => {
              cv.clearRect(0, 0, 1, 1);
              cv.fillStyle = c;
              cv.fillRect(0, 0, 1, 1);
              const e = cv.getImageData(0, 0, 1, 1).data;
              return [e[0], e[1], e[2], e[3] / 255];
            };
            const lum = ([r, g, b]) => {
              const f = (v) => {
                v /= 255;
                return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
              };
              return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
            };
            const s = getComputedStyle(b);
            const bg = rgba(s.backgroundColor);
            const page = rgba(getComputedStyle(document.body).backgroundColor);
            const eff = [0, 1, 2].map(
              (i) => bg[i] * bg[3] + (page[3] ? page[i] : 255) * (1 - bg[3]),
            );
            const fg = rgba(s.color);
            const L1 = lum(eff),
              L2 = lum(fg.slice(0, 3));
            return {
              text: b.innerText,
              bg: s.backgroundColor,
              alpha: +bg[3].toFixed(2),
              lum: +L1.toFixed(3),
              labelContrast: +(
                (Math.max(L1, L2) + 0.05) /
                (Math.min(L1, L2) + 0.05)
              ).toFixed(2),
            };
          });
        await page.mouse.move(0, 0);
        await page.waitForTimeout(400);
        const rest = await m();
        await btn.hover();
        await page.waitForTimeout(500);
        const hov = await m();
        console.log('BTN', scheme, JSON.stringify({ rest, hov }));
      }
      await page.close();
    }
    await ctx.close();
  }
// submit tests
for (const scheme of ['light', 'dark']) {
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    colorScheme: scheme,
  });
  for (const [p, fill] of [
    ['/auth/login', null],
    ['/auth/register', 'short'],
  ]) {
    const page = await ctx.newPage();
    await page.goto(BASE + p, { waitUntil: 'networkidle' });
    await page.evaluate(() =>
      document.querySelectorAll('form').forEach((f) => (f.noValidate = true)),
    );
    if (fill) {
      // fill password fields only with short value, leave others
      for (const i of await page.locator('input[type=password]').all())
        await i.fill('abc');
    }
    await page.locator('button[type=submit]').first().click();
    await page.waitForTimeout(1500);
    const r = await page.evaluate(() => {
      const cv = document
        .createElement('canvas')
        .getContext('2d', { willReadFrequently: true });
      const rgba = (c) => {
        cv.clearRect(0, 0, 1, 1);
        cv.fillStyle = c;
        cv.fillRect(0, 0, 1, 1);
        const e = cv.getImageData(0, 0, 1, 1).data;
        return [e[0], e[1], e[2], e[3] / 255];
      };
      const lum = ([r, g, b]) => {
        const f = (v) => {
          v /= 255;
          return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
        };
        return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
      };
      const over = (t, b) => {
        const a = t[3];
        return [0, 1, 2].map((i) => t[i] * a + b[i] * (1 - a)).concat([1]);
      };
      const ae = document.activeElement;
      const alerts = [...document.querySelectorAll('[role=alert]')]
        .filter((e) => e.innerText.trim())
        .map((e) => {
          let bg = [255, 255, 255, 1];
          const ch = [];
          for (let x = e; x; x = x.parentElement) ch.push(x);
          for (const x of ch.reverse()) {
            const c = rgba(getComputedStyle(x).backgroundColor);
            if (c[3] > 0) bg = over(c, bg);
          }
          const fg = over(rgba(getComputedStyle(e).color), bg);
          const a = lum(fg),
            b = lum(bg);
          return {
            text: e.innerText.slice(0, 80),
            ratio: +((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)).toFixed(
              2,
            ),
            fs: getComputedStyle(e).fontSize,
          };
        });
      return {
        url: location.pathname,
        active:
          ae.tagName +
          (ae.name ? '[' + ae.name + ']' : '') +
          (ae.id ? '#' + ae.id : ''),
        invalid: [...document.querySelectorAll('[aria-invalid=true]')].map(
          (e) => e.name || e.id,
        ),
        alerts,
      };
    });
    console.log('SUBMIT', scheme, p, JSON.stringify(r));
    await page.close();
  }
  await ctx.close();
}
await browser.close();
