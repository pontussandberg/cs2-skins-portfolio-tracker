import { mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { applyOrder } from "@/core/order";
import { EMPTY_PORTFOLIO, type InventorySnapshot, type PortfolioData, type PortfolioSnapshot, type SnapshotMeta } from "@/core/portfolio";
import type { QueryState, RunRecord, Watch } from "@/core/types";
import type { Store } from "./Store";

const RUNS_PER_WATCH = 200;
/** Snapshot ids become file names: allow only what randomUUID produces. */
const SNAPSHOT_ID = /^[a-z0-9-]{1,64}$/i;

const toMeta = ({ id, label, takenAt, totals }: SnapshotMeta): SnapshotMeta => ({ id, label, takenAt, totals });

/**
 * JSON-on-disk store.
 *   data/watches.json              all watch configs
 *   data/state/<queryHash>.json    last snapshot + seen-set per sub-query
 *   data/runs/<watchId>.json       run history, newest first, capped
 *   data/inventory.json            last inventory sync (a cache; re-synced from CSFloat)
 *   data/portfolio.json            valuations and settings you entered (back this one up)
 *   data/snapshots/<id>.json       portfolio snapshots you saved
 * Single process, single writer (the queue runs one job at a time), atomic writes.
 */
export class FileStore implements Store {
  private watches: Map<string, Watch> | null = null;
  private runs = new Map<string, RunRecord[]>();
  private runsLoaded = false;
  /** Snapshot summaries by id, loaded once (snapshot files are large; lists only need these). */
  private snapshotMetas: Map<string, SnapshotMeta> | null = null;
  private writeChain: Promise<void> = Promise.resolve();

  constructor(private dir: string) {}

  async init(): Promise<void> {
    await mkdir(path.join(this.dir, "state"), { recursive: true });
    await mkdir(path.join(this.dir, "runs"), { recursive: true });
    await this.loadWatches();
    await this.loadRuns();
  }

  // ---- watches ----

  // Every loaded watch has a position (see loadWatches), so ordering is just by position.
  async listWatches(): Promise<Watch[]> {
    const map = await this.loadWatches();
    return [...map.values()].sort((a, b) => a.position! - b.position!);
  }

  async getWatch(id: string): Promise<Watch | null> {
    return (await this.loadWatches()).get(id) ?? null;
  }

  /** A watch saved without a position (i.e. a new one) goes last. */
  async saveWatch(watch: Watch): Promise<void> {
    const map = await this.loadWatches();
    const position = watch.position ?? map.get(watch.id)?.position ?? Math.max(-1, ...[...map.values()].map((w) => w.position!)) + 1;
    map.set(watch.id, { ...watch, position });
    await this.writeJson("watches.json", [...map.values()]);
  }

  async reorderWatches(ids: string[]): Promise<void> {
    const map = await this.loadWatches();
    applyOrder(await this.listWatches(), ids).forEach((w, position) => map.set(w.id, { ...w, position }));
    await this.writeJson("watches.json", [...map.values()]);
  }

  async deleteWatch(id: string): Promise<void> {
    const map = await this.loadWatches();
    map.delete(id);
    this.runs.delete(id);
    await this.writeJson("watches.json", [...map.values()]);
    await rm(path.join(this.dir, "runs", `${id}.json`), { force: true });
  }

  // ---- query state ----

  async getQueryState(hash: string): Promise<QueryState | null> {
    return this.readJson<QueryState>(path.join("state", `${hash}.json`));
  }

  async saveQueryStates(states: QueryState[]): Promise<void> {
    for (const s of states) await this.writeJson(path.join("state", `${s.hash}.json`), s);
  }

  // ---- runs ----

  async saveRun(run: RunRecord): Promise<void> {
    await this.loadRuns();
    const list = this.runs.get(run.watchId) ?? [];
    const idx = list.findIndex((r) => r.id === run.id);
    if (idx >= 0) list[idx] = run;
    else list.unshift(run);
    const trimmed = list.slice(0, RUNS_PER_WATCH);
    this.runs.set(run.watchId, trimmed);
    await this.writeJson(path.join("runs", `${run.watchId}.json`), trimmed);
  }

  async getRun(id: string): Promise<RunRecord | null> {
    await this.loadRuns();
    for (const list of this.runs.values()) {
      const found = list.find((r) => r.id === id);
      if (found) return found;
    }
    return null;
  }

  async listRuns(watchId: string, limit = RUNS_PER_WATCH): Promise<RunRecord[]> {
    await this.loadRuns();
    return (this.runs.get(watchId) ?? []).slice(0, limit);
  }

  async listAllRuns(limit = 1000): Promise<RunRecord[]> {
    await this.loadRuns();
    return [...this.runs.values()]
      .flat()
      .sort((a, b) => (b.queuedAt < a.queuedAt ? -1 : b.queuedAt > a.queuedAt ? 1 : 0))
      .slice(0, limit);
  }

  // ---- portfolio ----

  getInventory(): Promise<InventorySnapshot | null> {
    return this.readJson<InventorySnapshot>("inventory.json");
  }

  saveInventory(snapshot: InventorySnapshot): Promise<void> {
    return this.writeJson("inventory.json", snapshot);
  }

  async getPortfolio(): Promise<PortfolioData> {
    const data = await this.readJson<Partial<PortfolioData>>("portfolio.json");
    return { settings: { ...EMPTY_PORTFOLIO.settings, ...data?.settings }, valuations: data?.valuations ?? {} };
  }

  savePortfolio(data: PortfolioData): Promise<void> {
    return this.writeJson("portfolio.json", data);
  }

  async listSnapshots(): Promise<SnapshotMeta[]> {
    const metas = [...(await this.loadSnapshotMetas()).values()];
    return metas.sort((a, b) => (b.takenAt < a.takenAt ? -1 : b.takenAt > a.takenAt ? 1 : 0));
  }

  getSnapshot(id: string): Promise<PortfolioSnapshot | null> {
    if (!SNAPSHOT_ID.test(id)) return Promise.resolve(null);
    return this.readJson<PortfolioSnapshot>(path.join("snapshots", `${id}.json`));
  }

  async saveSnapshot(snapshot: PortfolioSnapshot): Promise<void> {
    if (!SNAPSHOT_ID.test(snapshot.id)) throw new Error(`Invalid snapshot id: ${snapshot.id}`);
    const metas = await this.loadSnapshotMetas();
    await this.writeJson(path.join("snapshots", `${snapshot.id}.json`), snapshot);
    metas.set(snapshot.id, toMeta(snapshot));
  }

  async deleteSnapshot(id: string): Promise<boolean> {
    const metas = await this.loadSnapshotMetas();
    if (!metas.has(id)) return false;
    await rm(path.join(this.dir, "snapshots", `${id}.json`), { force: true });
    metas.delete(id);
    return true;
  }

  // ---- internals ----

  private async loadWatches(): Promise<Map<string, Watch>> {
    if (!this.watches) {
      const list = (await this.readJson<Watch[]>("watches.json")) ?? [];
      // Normalise order once: saved positions first, then watches from before ordering existed, by name.
      const unordered = Number.MAX_SAFE_INTEGER;
      list.sort((a, b) => (a.position ?? unordered) - (b.position ?? unordered) || a.name.localeCompare(b.name));
      this.watches = new Map(list.map((w, position) => [w.id, { ...w, position }]));
    }
    return this.watches;
  }

  private async loadSnapshotMetas(): Promise<Map<string, SnapshotMeta>> {
    if (!this.snapshotMetas) {
      let files: string[] = [];
      try {
        files = (await readdir(path.join(this.dir, "snapshots"))).filter((f) => f.endsWith(".json"));
      } catch {
        /* no snapshots yet */
      }
      const snapshots = await Promise.all(files.map((f) => this.readJson<PortfolioSnapshot>(path.join("snapshots", f))));
      this.snapshotMetas = new Map(snapshots.filter((s) => s !== null).map((s) => [s.id, toMeta(s)]));
    }
    return this.snapshotMetas;
  }

  private async loadRuns(): Promise<void> {
    if (this.runsLoaded) return;
    this.runsLoaded = true;
    let files: string[] = [];
    try {
      files = await readdir(path.join(this.dir, "runs"));
    } catch {
      return;
    }
    for (const file of files) {
      if (!file.endsWith(".json")) continue;
      const list = await this.readJson<RunRecord[]>(path.join("runs", file));
      if (list) this.runs.set(file.slice(0, -5), list);
    }
  }

  private async readJson<T>(rel: string): Promise<T | null> {
    try {
      return JSON.parse(await readFile(path.join(this.dir, rel), "utf8")) as T;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw err;
    }
  }

  /** Serialised, atomic (temp file + rename) writes. */
  private writeJson(rel: string, value: unknown): Promise<void> {
    const target = path.join(this.dir, rel);
    const task = this.writeChain.then(async () => {
      await mkdir(path.dirname(target), { recursive: true });
      const tmp = `${target}.${process.pid}.tmp`;
      await writeFile(tmp, JSON.stringify(value, null, 1), "utf8");
      await rename(tmp, target);
    });
    this.writeChain = task.catch(() => undefined);
    return task;
  }
}
