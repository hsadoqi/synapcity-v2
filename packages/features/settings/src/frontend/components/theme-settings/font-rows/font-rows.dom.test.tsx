import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { stubBrowser } from '../../../testing';
import { BodyFontRow, CodeFontRow, HeadingFontRow } from './font-rows';

beforeEach(stubBrowser);
afterEach(() => vi.unstubAllGlobals());

describe('font rows', () => {
  it.each([
    [
      'Heading font',
      'Heading font preview',
      <HeadingFontRow key="h" value="default" onChange={() => {}} />,
    ],
    [
      'Body font',
      'Body font preview',
      <BodyFontRow key="b" value="default" onChange={() => {}} />,
    ],
    [
      'Monospace font',
      'Code font preview',
      <CodeFontRow key="c" value="default" onChange={() => {}} />,
    ],
  ])('%s has a select and a labelled preview', (name, preview, row) => {
    render(row);

    expect(screen.getByRole('combobox', { name })).toBeTruthy();
    const figure = screen.getByRole('figure', { name: preview });
    expect(figure.textContent).toContain('Preview');
  });

  it('puts the preview after the select it belongs to', () => {
    render(<HeadingFontRow value="default" onChange={() => {}} />);

    const figure = screen.getByRole('figure');
    const select = screen.getByRole('combobox');
    expect(
      select.compareDocumentPosition(figure) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('sets each preview in its own role font', () => {
    render(
      <>
        <HeadingFontRow value="default" onChange={() => {}} />
        <BodyFontRow value="default" onChange={() => {}} />
        <CodeFontRow value="default" onChange={() => {}} />
      </>,
    );

    const sentence = (name: string) =>
      screen.getByRole('figure', { name }).querySelector('p')!;
    expect(sentence('Heading font preview').className).toContain(
      'font-heading',
    );
    expect(sentence('Body font preview').className).toContain('font-body');
    expect(sentence('Code font preview').className).toContain('font-code');
  });

  it('sets the sample in the row’s chosen font, on the sample alone', () => {
    render(<HeadingFontRow value="lora" onChange={() => {}} />);

    expect(
      screen
        .getByRole('figure')
        .style.getPropertyValue('--font-preference-heading'),
    ).toBe("'Lora', serif");
    expect(
      document.documentElement.style.getPropertyValue(
        '--font-preference-heading',
      ),
    ).toBe('');
  });

  it('says when the chosen family could not be loaded', async () => {
    render(<HeadingFontRow value="lora" onChange={() => {}} />);
    const link = document.getElementById('font-preference-lora')!;
    expect(screen.queryByText(/couldn’t be loaded/)).toBeNull();

    link.dispatchEvent(new Event('error'));

    expect(
      await screen.findByText(
        'Lora couldn’t be loaded from Google Fonts, so this sample uses a fallback font.',
      ),
    ).toBeTruthy();
  });

  it('shows the current choice and offers the default first', async () => {
    render(<CodeFontRow value="fira-code" onChange={() => {}} />);

    expect(screen.getByRole('combobox').textContent).toContain('Fira Code');
    fireEvent.click(screen.getByRole('combobox'));
    const options = (await screen.findAllByRole('option')).map(
      (o) => o.textContent,
    );
    expect(options[0]).toBe('Default (Geist Mono)');
    expect(options).toContain('JetBrains Mono');
  });

  it('reports the chosen font', async () => {
    const onChange = vi.fn();
    render(<HeadingFontRow value="default" onChange={onChange} />);

    fireEvent.click(screen.getByRole('combobox'));
    const item = await screen.findByRole('option', {
      name: 'Playfair Display',
    });
    fireEvent.pointerDown(item, { pointerType: 'mouse', button: 0 });
    fireEvent.click(item, { detail: 1 });

    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith('playfair-display'),
    );
  });
});
