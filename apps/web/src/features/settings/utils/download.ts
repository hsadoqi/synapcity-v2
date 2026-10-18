import { toTransferFile } from '../lib/scope';
import {
  type TransferFeedback,
  type TransferSettings,
  transferSchema,
} from '../types/import-export';

export function download(value: TransferSettings): TransferFeedback {
  let url: string | undefined;
  let anchor: HTMLAnchorElement | undefined;

  try {
    const blob = new Blob(
      // Version 2 separates what follows the person from what stays on this
      // device (ADR-0010). The importer still reads the older flat files.
      [JSON.stringify(toTransferFile(transferSchema.parse(value)), null, 2)],
      { type: 'application/json' },
    );
    url = URL.createObjectURL(blob);
    anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `synapcity-preferences-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(anchor);
    anchor.click();

    return {
      type: 'success',
      message: 'Your preferences have been exported.',
    };
  } catch {
    return {
      type: 'error',
      message: 'We couldn’t export your preferences. Please try again.',
    };
  } finally {
    anchor?.remove();
    if (url !== undefined) {
      // Let the browser begin the download before releasing its blob URL.
      const downloadUrl = url;
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
    }
  }
}
