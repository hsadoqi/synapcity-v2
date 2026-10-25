import type { Intention } from '@/lib/intention';

/** Greedy word wrap against any measuring function, so it can be tested without a canvas. */
export function wrapText(
  text: string,
  maxWidth: number,
  measure: (s: string) => number,
): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split('\n')) {
    let line = '';
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const candidate = line ? `${line} ${word}` : word;
      if (line && measure(candidate) > maxWidth) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    lines.push(line);
  }
  return lines;
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.append(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    return ok;
  }
}

export function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const canShare = () =>
  typeof navigator !== 'undefined' && typeof navigator.share === 'function';

export async function shareText(title: string, text: string): Promise<boolean> {
  try {
    await navigator.share({ title, text });
    return true;
  } catch {
    return false; // dismissed, or not allowed
  }
}

export function intentionFilename(i: Intention, ext: 'md' | 'png'): string {
  const slug = i.dateLabel
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `intention-${slug}.${ext}`;
}

type Colors = {
  background: string;
  card: string;
  foreground: string;
  primary: string;
  muted: string;
  border: string;
};

const readColors = (): Colors => {
  const s = getComputedStyle(document.documentElement);
  const v = (name: string) => s.getPropertyValue(name).trim();
  return {
    background: v('--background'),
    card: v('--card'),
    foreground: v('--foreground'),
    primary: v('--primary'),
    muted: v('--muted-foreground'),
    border: v('--border'),
  };
};

/**
 * Draws the intention card to a PNG in the colours of the active view, so what you save looks
 * like what you saw. Nothing leaves the browser.
 */
export async function renderIntentionPng(i: Intention): Promise<Blob> {
  await document.fonts?.ready;
  const c = readColors();
  const family = getComputedStyle(document.body).fontFamily;
  const W = 1080;
  const pad = 80;
  const inner = W - pad * 2;

  const probe = document.createElement('canvas').getContext('2d')!;
  const lineH = (size: number) => Math.round(size * 1.35);

  const blocks: {
    text: string;
    size: number;
    weight: number;
    color: string;
    gap: number;
  }[] = [
    {
      text: `${i.dateLabel.toUpperCase()}  ·  ${i.runName.toUpperCase()}`,
      size: 24,
      weight: 500,
      color: c.primary,
      gap: 36,
    },
    { text: i.headline, size: 64, weight: 300, color: c.foreground, gap: 48 },
    ...i.lines.flatMap((l) => [
      {
        text: l.label.toUpperCase(),
        size: 22,
        weight: 600,
        color: c.primary,
        gap: 6,
      },
      { text: l.text, size: 34, weight: 400, color: c.foreground, gap: 26 },
    ]),
    ...(i.pace
      ? [{ text: i.pace, size: 26, weight: 400, color: c.muted, gap: 0 }]
      : []),
  ];

  const laid = blocks.map((b) => {
    probe.font = `${b.weight} ${b.size}px ${family}`;
    return {
      ...b,
      lines: wrapText(b.text, inner, (s) => probe.measureText(s).width),
    };
  });
  const bodyHeight = laid.reduce(
    (h, b) => h + b.lines.length * lineH(b.size) + b.gap,
    0,
  );
  const H = Math.max(1080, pad * 2 + bodyHeight + 40);

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = c.background;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = c.card;
  ctx.fillRect(32, 32, W - 64, H - 64);
  ctx.strokeStyle = c.border;
  ctx.lineWidth = 2;
  ctx.strokeRect(32, 32, W - 64, H - 64);
  ctx.fillStyle = c.primary;
  ctx.fillRect(pad, 32, 120, 6);

  let y = pad + 24;
  ctx.textBaseline = 'top';
  for (const b of laid) {
    ctx.font = `${b.weight} ${b.size}px ${family}`;
    ctx.fillStyle = b.color;
    for (const line of b.lines) {
      ctx.fillText(line, pad, y);
      y += lineH(b.size);
    }
    y += b.gap;
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error('Could not draw the card.')),
      'image/png',
    );
  });
}
