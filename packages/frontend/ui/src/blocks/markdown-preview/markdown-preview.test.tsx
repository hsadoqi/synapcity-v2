import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { MarkdownPreview } from '@synapcity/frontend-ui/blocks/markdown-preview';

describe('MarkdownPreview', () => {
  it('shows the title as a heading, the lede, bullets and code', () => {
    render(
      <MarkdownPreview
        title="Launch Checklist"
        lede="Run the review."
        bullets={['Verify preview URL', 'Tag the release']}
        code="pnpm verify"
      />,
    );

    expect(
      screen.getByRole('heading', { name: 'Launch Checklist' }),
    ).toBeTruthy();
    expect(screen.getByText('Run the review.')).toBeTruthy();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByText('pnpm verify').tagName).toBe('CODE');
  });

  it('falls back to a placeholder title and leaves the rest out', () => {
    render(<MarkdownPreview />);

    expect(screen.getByRole('heading', { name: 'Heading' })).toBeTruthy();
    expect(screen.queryByRole('list')).toBeNull();
  });
});
