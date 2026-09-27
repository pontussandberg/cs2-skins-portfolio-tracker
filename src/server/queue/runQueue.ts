import { randomUUID } from "node:crypto";
import PQueue from "p-queue";
import type { RunRecord, RunTrigger } from "@/core/types";
import { executeRun, type WorkerDeps } from "../worker/runWatch";

/**
 * One in-process queue, concurrency 1. Manual clicks and cron ticks both land here.
 * A watch that already has a queued/running run gets that run back instead of a duplicate.
 */
export class RunQueue {
  private queue = new PQueue({ concurrency: 1 });
  private activeByWatch = new Map<string, string>();

  constructor(private deps: WorkerDeps) {}

  get size(): number {
    return this.queue.size + this.queue.pending;
  }

  isActive(watchId: string): boolean {
    return this.activeByWatch.has(watchId);
  }

  async enqueue(watchId: string, trigger: RunTrigger): Promise<RunRecord> {
    const existingId = this.activeByWatch.get(watchId);
    if (existingId) {
      const existing = await this.deps.store.getRun(existingId);
      if (existing) return existing;
    }

    const run: RunRecord = {
      id: randomUUID(),
      watchId,
      trigger,
      status: "queued",
      queuedAt: new Date().toISOString(),
      startedAt: null,
      finishedAt: null,
      requests: 0,
      baseline: false,
      total: 0,
      added: [],
      priceChanged: [],
      gone: [],
      error: null,
    };
    await this.deps.store.saveRun(run);
    this.activeByWatch.set(watchId, run.id);
    this.deps.bus.emit({ type: "run.queued", watchId, runId: run.id });

    this.queue
      .add(async () => {
        try {
          await executeRun(this.deps, run.id);
        } finally {
          this.activeByWatch.delete(watchId);
        }
      })
      .catch((err: unknown) => this.deps.logger.error({ err, runId: run.id }, "queue job crashed"));

    return run;
  }

  onIdle(): Promise<void> {
    return this.queue.onIdle();
  }
}
