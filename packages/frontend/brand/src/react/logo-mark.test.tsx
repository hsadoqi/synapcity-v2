import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SynapcityLogo, SynapcityMark, SynapcityWordmark } from './index';

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

describe('geometry', () => {
  it('keeps the shipped view boxes', () => {
    expect(
      svgOf(render(<SynapcityMark />).container).getAttribute('viewBox'),
    ).toBe('0 0 32 32');
    expect(
      svgOf(render(<SynapcityWordmark />).container).getAttribute('viewBox'),
    ).toBe('0 0 4348 865');
    expect(
      svgOf(render(<SynapcityLogo />).container).getAttribute('viewBox'),
    ).toBe('0 0 5868 1100');
  });

  it('draws the mark as two stroked squares and a core', () => {
    const { container } = render(<SynapcityMark />);
    const rects = [...container.querySelectorAll('rect')];

    expect(rects.map((r) => r.getAttribute('x'))).toEqual(['3', '11', '13.75']);
    expect(rects[2]?.getAttribute('data-slot')).toBe('synapcity-mark-core');
  });

  it('draws in currentColor so it follows the text colour', () => {
    const { container } = render(<SynapcityLogo />);

    expect(container.querySelector('g[stroke]')?.getAttribute('stroke')).toBe(
      'currentColor',
    );
    expect(container.querySelector('path')?.getAttribute('fill')).toBe(
      'currentColor',
    );
  });

  it('lets the core take its own class or colour', () => {
    const withClass = render(<SynapcityMark coreClassName="fill-primary" />);
    expect(
      withClass.container
        .querySelector('[data-slot="synapcity-mark-core"]')
        ?.getAttribute('class'),
    ).toBe('fill-primary');
    withClass.unmount();

    const { container } = render(<SynapcityLogo coreColor="red" />);
    expect(
      container
        .querySelector('[data-slot="synapcity-mark-core"]')
        ?.getAttribute('fill'),
    ).toBe('red');
  });

  it('scales the logo mark by the height of the lockup over the grid', () => {
    const { container } = render(<SynapcityLogo />);

    expect(
      container.querySelector('g[transform]')?.getAttribute('transform'),
    ).toBe('scale(34.375)');
  });

  it.each([
    ['xs', 'size-4', 'h-3', 'h-4'],
    ['sm', 'size-5', 'h-4', 'h-5'],
    ['md', 'size-6', 'h-5', 'h-6'],
    ['lg', 'size-8', 'h-6', 'h-8'],
    ['xl', 'size-12', 'h-8', 'h-12'],
  ] as const)('maps preset %s', (size, mark, wordmark, logo) => {
    const classes = (element: React.ReactElement) =>
      svgOf(render(element).container).getAttribute('class');

    expect(classes(<SynapcityMark size={size} />)).toContain(mark);
    expect(classes(<SynapcityWordmark size={size} />)).toContain(wordmark);
    expect(classes(<SynapcityLogo size={size} />)).toContain(logo);
  });
});
