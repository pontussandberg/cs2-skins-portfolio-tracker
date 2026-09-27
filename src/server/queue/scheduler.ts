import { Cron } from "croner";
import type { Watch } from "@/core/types";
import type { Logger } from "../logger";

/** One croner job per enabled watch with a schedule. */
export class Scheduler {
  private jobs = new Map<string, Cron>();
  private suspendedReason: string | null = null;

  constructor(
    private timezone: string,
    private onTick: (watchId: string) => void,
    private logger: Logger,
  ) {}

  /** Returns an error message for an invalid cron expression, else null. */
  static validate(expression: string): string | null {
    try {
      const probe = new Cron(expression, { paused: true });
      probe.stop();
      return null;
    } catch (err) {
      return err instanceof Error ? err.message : "Invalid cron expression";
    }
  }

  sync(watch: Watch): void {
    this.remove(watch.id);
    if (!watch.enabled || !watch.schedule) return;
    try {
      const job = new Cron(watch.schedule, { timezone: this.timezone, protect: true }, () => {
        if (this.suspendedReason) return;
        this.onTick(watch.id);
      });
      this.jobs.set(watch.id, job);
    } catch (err) {
      this.logger.error({ err, watchId: watch.id, schedule: watch.schedule }, "could not schedule watch");
    }
  }

  syncAll(watches: Watch[]): void {
    const ids = new Set(watches.map((w) => w.id));
    for (const id of [...this.jobs.keys()]) if (!ids.has(id)) this.remove(id);
    for (const w of watches) this.sync(w);
    this.logger.info({ scheduled: this.jobs.size, timezone: this.timezone }, "scheduler synced");
  }

  remove(watchId: string): void {
    this.jobs.get(watchId)?.stop();
    this.jobs.delete(watchId);
  }

  nextRunAt(watchId: string): string | null {
    if (this.suspendedReason) return null;
    const next = this.jobs.get(watchId)?.nextRun();
    return next ? next.toISOString() : null;
  }

  suspend(reason: string): void {
    this.suspendedReason = reason;
    this.logger.warn({ reason }, "scheduler suspended");
  }

  resume(): void {
    this.suspendedReason = null;
    this.logger.info("scheduler resumed");
  }

  get suspended(): string | null {
    return this.suspendedReason;
  }

  stopAll(): void {
    for (const id of [...this.jobs.keys()]) this.remove(id);
  }
}
