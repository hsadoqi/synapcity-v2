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

  it('prefixes the date for screen readers when asked', () => {
    const { container } = render(<EntityDate at={at} srPrefix="Updated" />);

    expect(container.querySelector('.sr-only')?.textContent).toBe('Updated ');
  });
});
