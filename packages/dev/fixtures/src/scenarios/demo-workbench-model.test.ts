import { describe, expect, it } from 'vitest';

import { demoContent, demoWorkspaces } from './demo-workbench-model';

describe('demoWorkspaces', () => {
  const workspaces = demoWorkspaces();

  it('lists a record filed in several workspaces in each of them, as the same id', () => {
    const holders = new Map<string, number>();
    for (const w of workspaces)
      for (const r of w.resources)
        holders.set(r.id, (holders.get(r.id) ?? 0) + 1);
    const shared = [...holders].filter(([, n]) => n > 1);
    expect(shared.length).toBeGreaterThan(0);
    for (const w of workspaces)
      for (const r of w.resources)
        expect(r.alsoIn).toBe((holders.get(r.id) ?? 1) - 1);
  });

  it('has one empty workspace and lists pinned resources first', () => {
    expect(workspaces.some((w) => w.resources.length === 0)).toBe(true);
    for (const w of workspaces) {
      const firstUnpinned = w.resources.findIndex((r) => !r.pinned);
      if (firstUnpinned >= 0)
        expect(w.resources.slice(firstUnpinned).every((r) => !r.pinned)).toBe(
          true,
        );
    }
  });

  it('returns copies, so changing one result changes nothing else', () => {
    workspaces[0]!.resources.length = 0;
    expect(demoWorkspaces()[0]!.resources.length).toBeGreaterThan(0);
  });
});

describe('demoContent', () => {
  it('gives documents text and dashboards widgets, different per resource', () => {
    const all = demoWorkspaces().flatMap((w) => w.resources);
    for (const r of all) {
      const c = demoContent(r.id);
      if (r.kind === 'document')
        expect(c.paragraphs!.length).toBeGreaterThan(0);
      else expect(c.widgets!.length).toBeGreaterThan(0);
    }
    const texts = new Set(
      all
        .filter((r) => r.kind === 'document')
        .map((r) => demoContent(r.id).paragraphs!.join('|')),
    );
    expect(texts.size).toBeGreaterThan(10);
  });
});
