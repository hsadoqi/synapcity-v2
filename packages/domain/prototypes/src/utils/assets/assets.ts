import type { PrototypeRecords, RecordContext } from '../../types';
import { newRecord } from '../new-record';
import { putRecord, removeRecord } from '../record-tables';

/** Puts an image in `slot`, replacing whatever was there. */
export function setSlotAsset(
  records: PrototypeRecords,
  asset: { slot: string; name: string; dataUrl: string },
  ctx: RecordContext,
): PrototypeRecords {
  const cleared = clearSlotAsset(records, asset.slot);
  return putRecord(cleared, 'asset', {
    ...newRecord('asset', asset.name, ctx),
    slot: asset.slot,
    dataUrl: asset.dataUrl,
  });
}

export function clearSlotAsset(
  records: PrototypeRecords,
  slot: string,
): PrototypeRecords {
  const existing = Object.values(records.asset).find((a) => a.slot === slot);
  return existing ? removeRecord(records, 'asset', existing.id) : records;
}
