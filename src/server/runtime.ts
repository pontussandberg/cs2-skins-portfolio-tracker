import { randomUUID } from "node:crypto";
import type { SystemStatus, Watch } from "@/core/types";
import { loadConfig, type AppConfig } from "./config";
import { CsfloatClient } from "./csfloat/client";
import { RateGate } from "./csfloat/rateGate";
import { EventBus } from "./events";
import { createLogger, type Logger } from "./logger";
import { DiscordNotifier } from "./notify/discord";
import { RunQueue } from "./queue/runQueue";
import { Scheduler } from "./queue/scheduler";
import { FileStore } from "./store/FileStore";
import type { Store } from "./store/Store";
import { normalizeWatchInput } from "./watchInput";

/**
 * Everything long-lived in one object. Stored on globalThis so instrumentation.ts,
 * route handlers and dev hot reloads all share the same instance in one process.
 */
export interface Runtime {
  config: AppConfig;
  logger: Logger;
  store: Store;
  bus: EventBus;
  client: CsfloatClient;
  notifier: DiscordNotifier;
  queue: RunQueue;
  scheduler: Scheduler;
  ready: Promise<void>;

  status(): SystemStatus;
  createWatch(input: unknown): Promise<Watch>;
  updateWatch(id: string, input: unknown): Promise<Watch>;
  deleteWatch(id: string): Promise<boolean>;
  markWatchSeen(id: string): Promise<Watch>;
}

const KEY = Symbol.for("csfloat-watcher.runtime");
type GlobalWithRuntime = typeof globalThis & { [KEY]?: Runtime };

export interface CreateRuntimeOptions {
  /** CLI runs skip cron. */
  scheduler?: boolean;
}

export function createRuntime(opts: CreateRuntimeOptions = {}): Runtime {
  const config = loadConfig();
  const logger = createLogger(config.logLevel);
  const store = new FileStore(config.dataDir);
  const bus = new EventBus();
  const gate = new RateGate(config.minIntervalMs);
  const client = new CsfloatClient({ apiKey: config.csfloatApiKey, gate, logger });
  const notifier = new DiscordNotifier(config.discordWebhookUrl, config.appUrl, logger);

  // queue and scheduler reference each other through these closures
  let scheduler!: Scheduler;
  const queue = new RunQueue({
    store,
    client,
    bus,
    logger,
    notifier,
    onAuthError: (message) => {
      scheduler.suspend(message);
      bus.emit({ type: "scheduler.suspended", reason: message });
    },
  });
  scheduler = new Scheduler(
    config.timezone,
    (watchId) => {
      queue.enqueue(watchId, "cron").catch((err: unknown) => logger.error({ err, watchId }, "cron enqueue failed"));
    },
    logger,
  );

  async function start(): Promise<void> {
    await store.init();
    // Runs that were in flight when the process died will never finish.
    for (const run of await store.listAllRuns()) {
      if (run.status === "queued" || run.status === "running") {
        await store.saveRun({ ...run, status: "failed", finishedAt: new Date().toISOString(), error: "Interrupted by a restart" });
      }
    }
    if (opts.scheduler !== false) scheduler.syncAll(await store.listWatches());
    if (!config.csfloatApiKey) logger.warn("CSFLOAT_API_KEY is not set; runs will fail until it is");
    logger.info({ dataDir: config.dataDir }, "runtime ready");
  }

  const rt: Runtime = {
    config,
    logger,
    store,
    bus,
    client,
    notifier,
    queue,
    scheduler,
    ready: start(),

    status() {
      return {
        csfloatKeyConfigured: client.configured,
        discordConfigured: notifier.configured,
        schedulerSuspended: Boolean(scheduler.suspended),
        suspendedReason: scheduler.suspended,
        queueSize: queue.size,
        timezone: config.timezone,
      };
    },

    async createWatch(input) {
      const data = normalizeWatchInput(input, Scheduler.validate);
      const now = new Date().toISOString();
      const watch: Watch = { id: randomUUID(), ...data, createdAt: now, updatedAt: now, lastSeenAt: now };
      await store.saveWatch(watch);
      scheduler.sync(watch);
      bus.emit({ type: "watches.changed" });
      return watch;
    },

    async updateWatch(id, input) {
      const existing = await store.getWatch(id);
      if (!existing) throw new Error("Watch not found");
      const data = normalizeWatchInput(input, Scheduler.validate);
      const watch: Watch = { ...existing, ...data, updatedAt: new Date().toISOString() };
      await store.saveWatch(watch);
      scheduler.sync(watch);
      bus.emit({ type: "watches.changed" });
      return watch;
    },

    async deleteWatch(id) {
      const existing = await store.getWatch(id);
      if (!existing) return false;
      scheduler.remove(id);
      await store.deleteWatch(id);
      bus.emit({ type: "watches.changed" });
      return true;
    },

    async markWatchSeen(id) {
      const existing = await store.getWatch(id);
      if (!existing) throw new Error("Watch not found");
      const watch: Watch = { ...existing, lastSeenAt: new Date().toISOString() };
      await store.saveWatch(watch);
      return watch;
    },
  };
  return rt;
}

/** The process-wide runtime (created on first use). */
export function getRuntime(): Runtime {
  const g = globalThis as GlobalWithRuntime;
  if (!g[KEY]) g[KEY] = createRuntime();
  return g[KEY]!;
}

export async function ensureRuntime(): Promise<Runtime> {
  const rt = getRuntime();
  await rt.ready;
  return rt;
}
