/**
 * Serialises requests with a minimum gap and supports "pause until" when the API says so.
 * One gate is shared by every run, so rate limiting lives in one place.
 */
export class RateGate {
  private nextAllowedAt = 0;
  private pausedUntil = 0;
  private chain: Promise<void> = Promise.resolve();

  constructor(
    private minIntervalMs: number,
    private sleep: (ms: number) => Promise<void> = (ms) => new Promise((r) => setTimeout(r, ms)),
    private now: () => number = () => Date.now(),
  ) {}

  /** Resolves when the caller may send its request. Calls are served in order. */
  acquire(): Promise<void> {
    const turn = this.chain.then(async () => {
      const wait = Math.max(this.nextAllowedAt, this.pausedUntil) - this.now();
      if (wait > 0) await this.sleep(wait);
      this.nextAllowedAt = this.now() + this.minIntervalMs;
    });
    this.chain = turn.catch(() => undefined);
    return turn;
  }

  pauseUntil(epochMs: number): void {
    this.pausedUntil = Math.max(this.pausedUntil, epochMs);
  }

  get pausedUntilMs(): number {
    return this.pausedUntil;
  }
}

/**
 * Interpret a rate-limit reset header. Accepts epoch ms, epoch seconds, or seconds-from-now.
 */
export function parseResetHeader(value: string | null, nowMs: number): number | null {
  if (!value) return null;
  const n = Number(value);
  if (Number.isFinite(n)) {
    if (n > 1e12) return n; // epoch ms
    if (n > 1e9) return n * 1000; // epoch seconds
    return nowMs + n * 1000; // delta seconds
  }
  const date = Date.parse(value);
  return Number.isFinite(date) ? date : null;
}
