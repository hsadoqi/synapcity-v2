import { isPlainObject } from './is-plain-object';
import { accountPart } from './account';
import type { Settings } from './settings';

/** The device part of `settings`, for export. */
function devicePart(settings: Settings) {
  return {
    theme: {
      mode: settings.theme.mode,
      density: settings.theme.density,
      textSize: settings.theme.textSize,
    },
    appearance: settings.appearance,
  };
}

/** The export file format this build writes. Imports reject anything newer. */
export const TRANSFER_FILE_VERSION = 2;

/** The export file: what follows the person, and what stays on this device. */
export function toTransferFile(settings: Settings) {
  return {
    version: TRANSFER_FILE_VERSION,
    account: accountPart(settings),
    device: devicePart(settings),
  };
}

/**
 * Turns a version 2 export back into the flat shape the importer reads. Any
 * other input (the flat files exported before version 2) passes through.
 */
export function fromTransferFile(input: unknown): unknown {
  if (!isPlainObject(input) || input.version !== TRANSFER_FILE_VERSION)
    return input;
  const account = isPlainObject(input.account) ? input.account : {};
  const device = isPlainObject(input.device) ? input.device : {};
  const flat: Record<string, unknown> = {};
  for (const section of ['regional', 'notifications', 'privacy'] as const) {
    if (account[section] !== undefined) flat[section] = account[section];
  }
  if (isPlainObject(account.theme) || isPlainObject(device.theme)) {
    flat.theme = {
      ...(isPlainObject(account.theme) ? account.theme : {}),
      ...(isPlainObject(device.theme) ? device.theme : {}),
    };
  }
  if (device.appearance !== undefined) flat.appearance = device.appearance;
  return flat;
}
