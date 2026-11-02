import {
  fromTransferFile,
  isPlainObject,
  TRANSFER_FILE_VERSION,
} from '@synapcity/domain-preferences';
import { parseImportPatch } from '@synapcity/domain-preferences';
import type { ImportResult } from '../../types';

export async function importFile(
  file: Pick<File, 'name' | 'size' | 'text'>,
): Promise<ImportResult> {
  try {
    if (!file.name.toLowerCase().endsWith('.json'))
      throw new Error('Please choose a .json file.');
    if (file.size > 1024 * 1024)
      throw new Error('Please choose a file smaller than 1 MB.');

    const contents: unknown = JSON.parse(await file.text());
    if (
      isPlainObject(contents) &&
      typeof contents.version === 'number' &&
      contents.version > TRANSFER_FILE_VERSION
    ) {
      throw new Error(
        'This file comes from a newer version of Synapcity. Update the app and try again.',
      );
    }

    // Consent is given in the Data privacy tab, where its wording is shown. A
    // file can neither grant nor withdraw it.
    const input = fromTransferFile(contents);
    const hadPrivacy = isPlainObject(input) && Object.hasOwn(input, 'privacy');
    let preferences = input;
    if (hadPrivacy) {
      const { privacy: _privacy, ...rest } = input;
      preferences = rest;
    }

    const result = parseImportPatch(preferences);
    const notes = [
      result.ignored.length && `Ignored keys: ${result.ignored.join(', ')}.`,
      hadPrivacy &&
        'Privacy choices aren’t imported. Review them in Data privacy.',
    ].filter(Boolean);
    return {
      type: 'success',
      patch: result.patch,
      message: `Preferences imported. ${notes.length ? notes.join(' ') : 'You’re all set.'}`,
    };
  } catch (error) {
    return {
      type: 'error',
      message:
        error instanceof SyntaxError
          ? 'This file isn’t valid JSON. Check the file and try again.'
          : error instanceof Error
            ? error.message
            : 'Unable to import this file.',
    };
  }
}
