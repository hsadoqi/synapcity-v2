import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ExportRow, ImportRow, ResetRow } from './import-export-rows';

const file = (name = 'prefs.json') =>
  new File(['{}'], name, { type: 'application/json' });
const fileInput = () =>
  screen.getByLabelText('Import preferences file') as HTMLInputElement;

// Each button is named by its row’s <label for>, which wins over its text.
describe('ExportRow', () => {
  it('exports when clicked', () => {
    const onExport = vi.fn();
    render(<ExportRow onExport={onExport} disabled={false} />);

    fireEvent.click(screen.getByRole('button', { name: 'Export preferences' }));

    expect(onExport).toHaveBeenCalledTimes(1);
  });

  it('is described by its row and can be disabled', () => {
    render(<ExportRow onExport={() => {}} disabled />);
    const button = screen.getByRole('button', { name: 'Export preferences' });

    expect(button.getAttribute('aria-describedby')).toBe('export-description');
    expect(button.hasAttribute('disabled')).toBe(true);
  });
});

describe('ImportRow', () => {
  it('accepts only JSON files', () => {
    render(
      <ImportRow
        onImport={async () => {}}
        disabled={false}
        isImporting={false}
      />,
    );

    expect(fileInput().type).toBe('file');
    expect(fileInput().accept).toBe('.json');
  });

  it('opens the file picker from its button', () => {
    render(
      <ImportRow
        onImport={async () => {}}
        disabled={false}
        isImporting={false}
      />,
    );
    const click = vi.spyOn(fileInput(), 'click');

    fireEvent.click(screen.getByRole('button', { name: 'Import preferences' }));

    expect(click).toHaveBeenCalledTimes(1);
  });

  it('hands the chosen file to onImport', async () => {
    const onImport = vi.fn().mockResolvedValue(undefined);
    render(
      <ImportRow onImport={onImport} disabled={false} isImporting={false} />,
    );
    const chosen = file();

    fireEvent.change(fileInput(), { target: { files: [chosen] } });

    await waitFor(() => expect(onImport).toHaveBeenCalledWith(chosen));
  });

  it('ignores a change with no file', () => {
    const onImport = vi.fn();
    render(
      <ImportRow onImport={onImport} disabled={false} isImporting={false} />,
    );

    fireEvent.change(fileInput(), { target: { files: [] } });

    expect(onImport).not.toHaveBeenCalled();
  });

  it('clears the input after an import so the same file can be chosen again', async () => {
    const onImport = vi.fn().mockResolvedValue(undefined);
    render(
      <ImportRow onImport={onImport} disabled={false} isImporting={false} />,
    );
    const input = fileInput();
    const value = vi.spyOn(input, 'value', 'set');

    fireEvent.change(input, { target: { files: [file()] } });

    await waitFor(() => expect(value).toHaveBeenCalledWith(''));
  });

  it('shows progress and is marked busy while importing', () => {
    render(<ImportRow onImport={async () => {}} disabled isImporting />);
    const button = screen.getByRole('button', { name: 'Import preferences' });

    expect(button.textContent).toBe('Importing…');
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.hasAttribute('disabled')).toBe(true);
    expect(fileInput().disabled).toBe(true);
  });
});

describe('ResetRow', () => {
  const open = () =>
    fireEvent.click(screen.getByRole('button', { name: 'Reset to defaults' }));

  it('asks before resetting', async () => {
    const onReset = vi.fn();
    render(<ResetRow onReset={onReset} disabled={false} />);
    expect(screen.queryByRole('alertdialog')).toBeNull();

    open();

    expect(
      await screen.findByRole('alertdialog', {
        name: 'Start with a clean slate?',
      }),
    ).toBeTruthy();
    expect(onReset).not.toHaveBeenCalled();
  });

  it('resets and closes when confirmed', async () => {
    const onReset = vi.fn();
    render(<ResetRow onReset={onReset} disabled={false} />);
    open();
    await screen.findByRole('alertdialog');

    fireEvent.click(screen.getByRole('button', { name: 'Reset preferences' }));

    expect(onReset).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
  });

  it('keeps the settings when cancelled', async () => {
    const onReset = vi.fn();
    render(<ResetRow onReset={onReset} disabled={false} />);
    open();
    await screen.findByRole('alertdialog');

    fireEvent.click(screen.getByRole('button', { name: 'Keep my settings' }));

    expect(onReset).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
  });

  it('cannot be opened while disabled', () => {
    render(<ResetRow onReset={() => {}} disabled />);

    expect(
      screen
        .getByRole('button', { name: 'Reset to defaults' })
        .hasAttribute('disabled'),
    ).toBe(true);
  });
});
