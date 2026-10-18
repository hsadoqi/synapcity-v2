import { render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { EntityDate } from '@synapcity/frontend-ui/blocks/entity/entity-date';

const at = '2025-10-02T09:30:00.000Z';

describe('EntityDate', () => {
  it('renders a time-zone-free date on the server', () => {
    const html = renderToString(<EntityDate at={at} />);

    expect(html).toContain('Oct 2, 2025');
    expect(html).toContain(`dateTime="${at}"`);
  });

  it('uses relative words once running in the browser', () => {
    const recent = new Date().toISOString();
    render(<EntityDate at={recent} />);

    expect(screen.getByText('Today')).toBeTruthy();
  });

  it('renders a paragraph by default and a span when asked', () => {
    const paragraph = render(<EntityDate at={at} />);
    expect(paragraph.container.firstElementChild?.tagName).toBe('P');

    const span = render(<EntityDate at={at} as="span" />);
    expect(span.container.firstElementChild?.tagName).toBe('SPAN');
  });

  it('prefixes the date for screen readers when asked', () => {
    const { container } = render(<EntityDate at={at} srPrefix="Updated" />);

    expect(container.querySelector('.sr-only')?.textContent).toBe('Updated ');
  });
});
