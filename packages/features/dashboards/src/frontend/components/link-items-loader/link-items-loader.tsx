'use client';

import { LINK_WIDGET_TYPES } from '@synapcity/domain-dashboards';
import { useEffect, useMemo, useRef } from 'react';

import { useDashboardConfig } from '../../config';
import { useDashboardStore } from '../../store';
import { kindsListedBy } from '../../widgets/link-body';

/**
 * Asks the host to read the records a newly added link widget lists. The host
 * reads only the kinds the dashboard's stored composition needs at load time
 * (`unloadedKinds` are the rest), so a Pinned widget added in the browser has
 * no data until the host reads again. The read waits for the save: the host
 * works from the stored composition, which must already hold the widget. It
 * asks once per set of missing kinds, so a host that still cannot supply them
 * is not asked in a loop. Renders nothing.
 */
export function LinkItemsLoader() {
  const { unloadedKinds, onReload } = useDashboardConfig();
  const status = useDashboardStore((s) => s.saveStatus);
  const widgets = useDashboardStore((s) => s.composition.widgets);
  const asked = useRef(new Set<string>());

  const missing = useMemo(() => {
    const kinds = new Set<string>();
    for (const widget of widgets) {
      if (!LINK_WIDGET_TYPES.includes(widget.type)) continue;
      for (const kind of kindsListedBy(
        widget.type as 'pinned' | 'last-opened' | 'spaces',
      )) {
        if (unloadedKinds.includes(kind)) kinds.add(kind);
      }
    }
    return [...kinds].sort().join(',');
  }, [widgets, unloadedKinds]);

  useEffect(() => {
    if (!missing || status !== 'saved' || !onReload) return;
    if (asked.current.has(missing)) return;
    asked.current.add(missing);
    onReload();
  }, [missing, status, onReload]);

  return null;
}
