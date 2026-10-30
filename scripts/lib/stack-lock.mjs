// A lock for one worktree's disposable database stack. Two database test runs
// in the same worktree would share one set of containers and see each other's
// users and rows, so the second refuses to start instead of racing the first.
// Other worktrees have their own stack (see db-test-stack.mjs) and are not
// affected. The lock is a directory: `mkdir` is atomic, and the owner's pid
// lets a crashed run's lock be recognised as stale and replaced.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export class StackLockHeldError extends Error {
  constructor(owner) {
    super(
      owner
        ? `Another database test run holds this worktree's stack (pid ${owner.pid}, since ${owner.since}). ` +
            'Wait for it to finish, or stop it.'
        : "Another database test run is starting on this worktree's stack. Try again in a moment.",
    );
    this.name = 'StackLockHeldError';
    this.owner = owner;
  }
}

function alive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    // EPERM means it exists but belongs to someone else.
    return error.code === 'EPERM';
  }
}

function readOwner(file) {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

/** Takes the lock in `directory`, or throws `StackLockHeldError`. Returns a release function. */
export function acquireStackLock(directory, { pid = process.pid } = {}) {
  const lock = join(directory, 'run.lock');
  const ownerFile = join(lock, 'owner.json');
  mkdirSync(directory, { recursive: true });
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      mkdirSync(lock);
      writeFileSync(
        ownerFile,
        JSON.stringify({ pid, since: new Date().toISOString() }),
      );
      let released = false;
      return () => {
        if (released) return;
        released = true;
        rmSync(lock, { recursive: true, force: true });
      };
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      const owner = readOwner(ownerFile);
      // A lock whose owner is gone (a crash) is replaced once; an owner file
      // still being written (null) is treated as held.
      if (owner && !alive(owner.pid) && attempt === 0) {
        rmSync(lock, { recursive: true, force: true });
        continue;
      }
      throw new StackLockHeldError(owner);
    }
  }
  throw new StackLockHeldError(null);
}
