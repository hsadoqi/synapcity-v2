import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ImportExportFeedbackAlert } from './import-export-feedback-dialog';

describe('ImportExportFeedbackAlert', () => {
  it('renders nothing without feedback', () => {
    const { container } = render(
      <ImportExportFeedbackAlert feedback={null} onClose={() => {}} />,
    );

    expect(container.firstChild).toBeNull();
  });

  it('announces success politely, as a status', () => {
    render(
      <ImportExportFeedbackAlert
        feedback={{ type: 'success', message: 'Imported.' }}
        onClose={() => {}}
      />,
    );
    const status = screen.getByRole('status');

    expect(status.textContent).toContain('All set');
    expect(status.textContent).toContain('Imported.');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('announces an error assertively, as an alert', () => {
    render(
      <ImportExportFeedbackAlert
        feedback={{ type: 'error', message: 'Bad file.' }}
        onClose={() => {}}
      />,
    );
    const alert = screen.getByRole('alert');

    expect(alert.textContent).toContain('Couldn’t complete the action');
    expect(alert.textContent).toContain('Bad file.');
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('can be dismissed', () => {
    const onClose = vi.fn();
    render(
      <ImportExportFeedbackAlert
        feedback={{ type: 'success', message: 'Done.' }}
        onClose={onClose}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
