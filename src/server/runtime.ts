import { randomUUID } from "node:crypto";
import { readdirSync, statSync } from "node:fs";
import path from "node:path";
import { buildPortfolio, portfolioTotals, type InventorySnapshot, type PortfolioData, type PortfolioSnapshot } from "@/core/portfolio";
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
import { composeWatchName, lookupSearchName } from "./searchName";
import { normalizeSettingsInput, normalizeSnapshotLabel, normalizeValuationInput } from "./portfolioInput";
import { normalizeWatchInput, type NormalizedWatchInput } from "./watchInput";

/**
 * Everything long-lived in one object. Stored on globalThis so instrumentation.ts and route
 * handlers share one instance per process. In development it is rebuilt when server code
 * changes (see getRuntime).
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
  /** Save the dashboard order; returns all watches in the new order. */
  reorderWatches(ids: string[]): Promise<Watch[]>;
  markWatchSeen(id: string): Promise<Watch>;

  /**
   * The last inventory sync. Syncs first when there is none; when it is older than
   * INVENTORY_MAX_AGE_MS, returns it and re-syncs in the background.
   */
  getInventory(): Promise<InventorySnapshot | null>;
  /** Fetch the inventory from CSFloat now (joins a sync already in progress). */
  syncInventory(): Promise<InventorySnapshot>;
  inventoryStatus(): { syncing: boolean; error: string | null };
  /** Save your valuation of an item (by itemKey); all fields empty removes it. */
  setValuation(key: string, input: unknown): Promise<PortfolioData>;
  setPortfolioSettings(input: unknown): Promise<PortfolioData>;
  /** Freeze the current inventory (as last synced), its prices and your valuations. */
  takeSnapshot(label: unknown): Promise<PortfolioSnapshot>;
  deleteSnapshot(id: string): Promise<boolean>;
}

const INVENTORY_MAX_AGE_MS = 60 * 60 * 1000;

const KEY = Symbol.for("cs2-skins-portfolio-tracker.runtime");
/** `version` is the server code version the runtime was built from (dev only). */
type GlobalWithRuntime = typeof globalThis & { [KEY]?: { rt: Runtime; version: number } };

export interface CreateRuntimeOptions {
  /** CLI runs skip cron. */
  scheduler?: boolean;
  /** Reuse an event bus so open live-update streams survive a dev reload. */
  bus?: EventBus;
}

export function createRuntime(opts: CreateRuntimeOptions = {}): Runtime {
  const config = loadConfig();
  const logger = createLogger(config.logLevel);
  const store = new FileStore(config.dataDir);
  const bus = opts.bus ?? new EventBus();
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

  /** Name for a watch saved without one; one CSFloat request, falling back to the raw filters. */
  async function nameFor(data: NormalizedWatchInput): Promise<string> {
    const item = await lookupSearchName((params) => client.fetchListings(params), data.query).catch((err: unknown) => {
      logger.warn({ err }, "watch name lookup failed");
      return null;
    });
    return composeWatchName(item, data.query, data.seeds.length);
  }

  let inventorySync: Promise<InventorySnapshot> | null = null;
  let inventoryError: string | null = null;

  function syncInventory(): Promise<InventorySnapshot> {
    inventorySync ??= (async () => {
      try {
        const snapshot: InventorySnapshot = { syncedAt: new Date().toISOString(), items: await client.fetchInventory() };
        await store.saveInventory(snapshot);
        inventoryError = null;
        logger.info({ items: snapshot.items.length }, "inventory synced");
        return snapshot;
      } catch (err) {
        inventoryError = err instanceof Error ? err.message : String(err);
        logger.warn({ err }, "inventory sync failed");
        throw err;
      } finally {
        inventorySync = null;
        bus.emit({ type: "portfolio.changed" });
      }
    })();
    return inventorySync;
  }

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
      const watch: Watch = { id: randomUUID(), ...data, name: data.name ?? (await nameFor(data)), createdAt: now, updatedAt: now, lastSeenAt: now };
      await store.saveWatch(watch);
      scheduler.sync(watch);
      bus.emit({ type: "watches.changed" });
      return watch;
    },

    async updateWatch(id, input) {
      const existing = await store.getWatch(id);
      if (!existing) throw new Error("Watch not found");
      const data = normalizeWatchInput(input, Scheduler.validate);
      const watch: Watch = { ...existing, ...data, name: data.name ?? (await nameFor(data)), updatedAt: new Date().toISOString() };
      await store.saveWatch(watch);
      scheduler.sync(watch);
      bus.emit({ type: "watches.changed" });
      return watch;
    },

    async reorderWatches(ids) {
      for (const id of ids) {
        if (!(await store.getWatch(id))) throw new Error(`Watch not found: ${id}`);
      }
      await store.reorderWatches(ids);
      bus.emit({ type: "watches.changed" });
      return store.listWatches();
    },

    async deleteWatch(id) {
      const existing = await store.getWatch(id);
      if (!existing) return false;
      scheduler.remove(id);
      await store.deleteWatch(id);
      bus.emit({ type: "watches.changed" });
      return true;
    },

    async getInventory() {
      const snapshot = await store.getInventory();
      if (!snapshot) return client.configured ? syncInventory().catch(() => null) : null;
      if (!inventorySync && !inventoryError && Date.now() - Date.parse(snapshot.syncedAt) > INVENTORY_MAX_AGE_MS) {
        syncInventory().catch(() => undefined);
      }
      return snapshot;
    },

    syncInventory,

    inventoryStatus() {
      return { syncing: inventorySync !== null, error: inventoryError };
    },

    async setValuation(key, input) {
      const v = normalizeValuationInput(input);
      const data = await store.getPortfolio();
      const valuations = { ...data.valuations };
      if (Object.values(v).every((x) => x === null)) delete valuations[key];
      else valuations[key] = { ...v, updatedAt: new Date().toISOString() };
      const next = { ...data, valuations };
      await store.savePortfolio(next);
      bus.emit({ type: "portfolio.changed" });
      return next;
    },

    async setPortfolioSettings(input) {
      const next = { ...(await store.getPortfolio()), settings: normalizeSettingsInput(input) };
      await store.savePortfolio(next);
      bus.emit({ type: "portfolio.changed" });
      return next;
    },

    async takeSnapshot(rawLabel) {
      const label = normalizeSnapshotLabel(rawLabel);
      const [inventory, portfolio] = await Promise.all([store.getInventory(), store.getPortfolio()]);
      if (!inventory) throw new Error("Sync your inventory before saving a snapshot");
      const totals = portfolioTotals(buildPortfolio(inventory.items, portfolio).map((e) => e.value));
      const snapshot: PortfolioSnapshot = { id: randomUUID(), label, takenAt: new Date().toISOString(), totals, inventory, portfolio };
      await store.saveSnapshot(snapshot);
      bus.emit({ type: "portfolio.changed" });
      return snapshot;
    },

    async deleteSnapshot(id) {
      const deleted = await store.deleteSnapshot(id);
      if (deleted) bus.emit({ type: "portfolio.changed" });
      return deleted;
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

const DEV = process.env.NODE_ENV !== "production";
const CODE_DIRS = ["src/server", "src/core"];
let versionCache = { at: 0, value: 0 };

/**
 * Newest modification time of the runtime's source files. Dev only; checked at most once a second.
 * The runtime outlives Next's hot reload, so without this it would keep running old code.
 */
function codeVersion(): number {
  const now = Date.now();
  if (now - versionCache.at < 1000) return versionCache.value;
  let newest = 0;
  for (const dir of CODE_DIRS) {
    const root = path.join(/*turbopackIgnore: true*/ process.cwd(), dir);
    let entries: string[];
    try {
      entries = readdirSync(root, { recursive: true, encoding: "utf8" });
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (!entry.endsWith(".ts") || entry.includes("__tests__")) continue;
      try {
        newest = Math.max(newest, statSync(path.join(root, entry)).mtimeMs);
      } catch {
        /* deleted between readdir and stat */
      }
    }
  }
  versionCache = { at: now, value: newest };
  return newest;
}

/**
 * The process-wide runtime (created on first use). In development, when server code has changed
 * and no run is in progress, the old runtime's cron jobs are stopped and a fresh runtime is built
 * from the new code, keeping the event bus.
 */
export function getRuntime(): Runtime {
  const g = globalThis as GlobalWithRuntime;
  const current = g[KEY];
  if (!current) {
    const rt = createRuntime();
    g[KEY] = { rt, version: DEV ? codeVersion() : 0 };
    return rt;
  }
  if (!DEV) return current.rt;

  const version = codeVersion();
  if (version <= current.version || current.rt.queue.size > 0) return current.rt;
  current.rt.scheduler.stopAll();
  const rt = createRuntime({ bus: current.rt.bus });
  g[KEY] = { rt, version };
  rt.logger.info("server code changed; runtime reloaded");
  return rt;
}

export async function ensureRuntime(): Promise<Runtime> {
  const rt = getRuntime();
  await rt.ready;
  return rt;
}
