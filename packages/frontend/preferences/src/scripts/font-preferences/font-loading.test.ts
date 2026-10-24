import { describe, expect, it } from 'vitest';

import { fontStack, fontStylesheetUrl } from './font-loading';

describe('font loading', () => {
  it('builds the Google Fonts stylesheet URL for a family', () => {
    expect(fontStylesheetUrl('playfair-display')).toBe(
      'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400..700&display=swap',
    );
    expect(fontStylesheetUrl('poppins')).toBe(
      'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap',
    );
  });

  it('builds a quoted font stack with a generic fallback', () => {
    expect(fontStack('jetbrains-mono')).toBe("'JetBrains Mono', monospace");
  });
});
