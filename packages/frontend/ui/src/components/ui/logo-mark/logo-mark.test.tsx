import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  SynapcityLogo,
  SynapcityMark,
  SynapcityWordmark,
} from '@synapcity/frontend-ui/core/logo-mark';

function svgOf(container: HTMLElement) {
  return container.querySelector('svg') as SVGSVGElement;
}

describe('brand size', () => {
  it('maps a preset to its class and sets no explicit dimension', () => {
    const svg = svgOf(render(<SynapcityMark size="lg" />).container);

    expect(svg.getAttribute('class')).toContain('size-8');
    expect(svg.getAttribute('width')).toBeNull();
  });

  it('passes a number or CSS length through as the dimension', () => {
    expect(
      svgOf(render(<SynapcityMark size={40} />).container).getAttribute(
        'width',
      ),
    ).toBe('40');
    expect(
      svgOf(render(<SynapcityWordmark size="2rem" />).container).getAttribute(
        'height',
      ),
    ).toBe('2rem');
  });

  it.each(['toString', 'constructor', 'hasOwnProperty'])(
    'does not mistake the inherited name %j for a preset',
    (size) => {
      const mark = svgOf(render(<SynapcityMark size={size} />).container);
      const logo = svgOf(render(<SynapcityLogo size={size} />).container);

      expect(mark.getAttribute('width')).toBe(size);
      expect(mark.getAttribute('class')).not.toContain('function');
      expect(logo.getAttribute('height')).toBe(size);
      expect(logo.getAttribute('class')).not.toContain('function');
    },
  );
});

describe('accessible name', () => {
  it('hides the mark from assistive tech by default', () => {
    const svg = svgOf(render(<SynapcityMark />).container);

    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.getAttribute('role')).toBeNull();
  });

  it('names the wordmark and logo "synapcity" by default', () => {
    for (const element of [<SynapcityWordmark />, <SynapcityLogo />]) {
      const { container, unmount } = render(element);
      const svg = svgOf(container);

      expect(svg.getAttribute('role')).toBe('img');
      expect(container.querySelector('title')?.textContent).toBe('synapcity');
      unmount();
    }
  });

  it('is decorative when the title is null', () => {
    const svg = svgOf(render(<SynapcityLogo title={null} />).container);

    expect(svg.getAttribute('aria-hidden')).toBe('true');
  });
});
