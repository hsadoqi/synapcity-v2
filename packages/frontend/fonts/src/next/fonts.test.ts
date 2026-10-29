import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it, vi } from 'vitest';

// next/font is compiled away at build time, so in a test it has to be mocked.
// The mocks record the arguments, which is what the build reads.
const { inter, localFont } = vi.hoisted(() => ({
  inter: vi.fn((options: { variable: string }) => ({
    variable: `class${options.variable}`,
  })),
  localFont: vi.fn((options: { variable: string }) => ({
    variable: `class${options.variable}`,
  })),
}));
vi.mock('next/font/google', () => ({ Inter: inter }));
vi.mock('next/font/local', () => ({ default: localFont }));

import { fontVariableClasses, fontVariables } from './index';

// The loaders run once, when the module is imported. The shared Vitest config
// resets mock history before each test, so keep what they were called with.
const interCalls = [...inter.mock.calls];
const localFontCalls = [...localFont.mock.calls] as unknown as [
  { src: string; variable: string; preload?: boolean },
][];

describe('the loaders', () => {
  it('load Inter once, as the latin subset, under --font-inter', () => {
    expect(interCalls).toEqual([
      [{ subsets: ['latin'], variable: '--font-inter' }],
    ]);
  });

  it('load Geist and Geist Mono from the files beside them, once each', () => {
    expect(localFontCalls).toEqual([
      [{ src: './GeistVF.woff', variable: '--font-geist-sans' }],
      // Code only: not preloaded, so a page without code never fetches it.
      [
        {
          src: './GeistMonoVF.woff',
          variable: '--font-geist-mono',
          preload: false,
        },
      ],
    ]);
  });

  it('point at files that exist', () => {
    for (const [options] of localFontCalls) {
      expect(existsSync(join(import.meta.dirname, options.src))).toBe(true);
    }
  });
});

describe('the class names a host puts on <html>', () => {
  it('are the three variable classes, Inter then Geist then Geist Mono', () => {
    expect(fontVariableClasses).toEqual([
      'class--font-inter',
      'class--font-geist-sans',
      'class--font-geist-mono',
    ]);
  });

  it('can each be passed to classList.add, which throws on whitespace', () => {
    for (const name of fontVariableClasses) expect(name).not.toMatch(/\s/);
  });

  it('join with one space for a className', () => {
    expect(fontVariables).toBe(fontVariableClasses.join(' '));
    expect(fontVariables.split(' ')).toHaveLength(3);
  });
});

describe('the font files', () => {
  // Pinned so that a substituted or re-exported file is a visible change, not
  // a silent one: the default weights and axes are part of the typography.
  const pinned: Record<string, { sha256: string; bytes: number }> = {
    'GeistVF.woff': {
      sha256:
        '296fafafd41304f7c992079054b8af914dbbd865f32de97c66d0f613b55755d6',
      bytes: 66268,
    },
    'GeistMonoVF.woff': {
      sha256:
        'e8b65928f551b17e3d67c3f709721b952c39842d14b00701f9232057fde73608',
      bytes: 67864,
    },
  };

  for (const [name, expected] of Object.entries(pinned)) {
    it(`${name} is the file the apps shipped before the move`, () => {
      const file = readFileSync(join(import.meta.dirname, name));
      expect(file.subarray(0, 4).toString('latin1')).toBe('wOFF');
      expect(file.byteLength).toBe(expected.bytes);
      expect(createHash('sha256').update(file).digest('hex')).toBe(
        expected.sha256,
      );
    });
  }
});
