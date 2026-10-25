/**
 * A pausable countdown source built on a monotonic clock instead of counted intervals.
 * Interval ticks drift and stall in background tabs; reading the clock never does.
 *
 * It is also a tiny external store, so React reads it with `useSyncExternalStore`.
 * Elapsed time is clamped to `limitMs`, and the clock pauses itself when it gets there.
 */
export class StepClock {
  private accumulatedMs = 0;
  private startedAt: number | null = null;
  private limitMs = Number.POSITIVE_INFINITY;
  private readonly listeners = new Set<() => void>();
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly now: () => number = () => performance.now(),
    private readonly tickMs = 250,
  ) {}

  get running(): boolean {
    return this.startedAt !== null;
  }

  get expired(): boolean {
    return this.elapsedMs() >= this.limitMs;
  }

  elapsedMs(): number {
    const raw =
      this.accumulatedMs +
      (this.startedAt === null ? 0 : this.now() - this.startedAt);
    return Math.min(raw, this.limitMs);
  }

  setLimit(limitMs: number): void {
    this.limitMs = limitMs;
    this.settle();
    this.emit();
  }

  start(): void {
    if (this.startedAt !== null || this.expired) return;
    this.startedAt = this.now();
    this.emit();
  }

  pause(): void {
    if (this.startedAt === null) return;
    this.accumulatedMs += this.now() - this.startedAt;
    this.startedAt = null;
    this.accumulatedMs = Math.min(this.accumulatedMs, this.limitMs);
    this.emit();
  }

  /** Jump to an elapsed time. A running clock keeps running from there. */
  reset(elapsedMs = 0): void {
    this.accumulatedMs = Math.max(0, elapsedMs);
    if (this.startedAt !== null) this.startedAt = this.now();
    this.settle();
    this.emit();
  }

  /** Called by the interval; also safe to call by hand. */
  tick(): void {
    this.settle();
    this.emit();
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    if (this.timer === null)
      this.timer = setInterval(() => this.tick(), this.tickMs);
    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0 && this.timer !== null) {
        clearInterval(this.timer);
        this.timer = null;
      }
    };
  };

  private settle(): void {
    if (this.startedAt !== null && this.elapsedMs() >= this.limitMs) {
      this.accumulatedMs = this.limitMs;
      this.startedAt = null;
    }
  }

  private emit(): void {
    this.listeners.forEach((l) => l());
  }
}

export function remainingMs(durationSec: number, elapsedMs: number): number {
  return Math.max(0, durationSec * 1000 - elapsedMs);
}
