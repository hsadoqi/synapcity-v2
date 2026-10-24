import type { PrototypeRecords, RecordContext } from '../../types';
import { newRecord } from '../new-record';
import { normalizeLinkUrl } from '../normalize-link-url';
import { putRecord } from '../record-tables';

/** Adds a link; returns `records` unchanged without a name or a web address. */
export function addLink(
  records: PrototypeRecords,
  name: string,
  url: string,
  ctx: RecordContext,
): PrototypeRecords {
  const href = normalizeLinkUrl(url);
  const trimmed = name.trim();
  if (!href || !trimmed) return records;
  return putRecord(records, 'link', {
    ...newRecord('link', trimmed, ctx),
    url: href,
  });
}
