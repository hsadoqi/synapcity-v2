import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { acquireStackLock, StackLockHeldError } from './stack-lock.mjs';

let dir;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'stack-lock-'));
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

describe('acquireStackLock', () => {
  it('refuses a second holder while the first is alive', () => {
    const release = acquireStackLock(dir);
    expect(() => acquireStackLock(dir)).toThrow(StackLockHeldError);
    release();
    expect(() => acquireStackLock(dir)()).not.toThrow();
  });

  it('release is idempotent and frees the lock', () => {
    const release = acquireStackLock(dir);
    release();
    release();
    acquireStackLock(dir)();
  });

  it('replaces the lock of an owner that no longer exists', () => {
    // A finished child's pid is not alive any more.
    const finished = spawnSync(process.execPath, ['-e', '0']);
    acquireStackLock(dir, { pid: finished.pid });
    const release = acquireStackLock(dir);
    release();
  });

  it('names the owner in the error', () => {
    acquireStackLock(dir);
    try {
      acquireStackLock(dir);
      expect.unreachable();
    } catch (error) {
      expect(error.message).toContain(`pid ${process.pid}`);
    }
  });
});
