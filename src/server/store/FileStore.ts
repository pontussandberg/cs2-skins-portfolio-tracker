import { mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type { QueryState, RunRecord, Watch } from "@/core/types";
import type { Store } from "./Store";

const RUNS_PER_WATCH = 200;

/**
 * JSON-on-disk store.
 *   data/watches.json              all watch configs
 *   data/state/<queryHash>.json    last snapshot + seen-set per sub-query
 *   data/runs/<watchId>.json       run history, newest first, capped
 * Single process, single writer (the queue runs one job at a time), atomic writes.
 */
export class FileStore implements Store {
  private watches: Map<string, Watch> | null = null;
  private runs = new Map<string, RunRecord[]>();
  private runsLoaded = false;
  private writeChain: Promise<void> = Promise.resolve();

  constructor(private dir: string) {}

  async init(): Promise<void> {
    await mkdir(path.join(this.dir, "state"), { recursive: true });
    await mkdir(path.join(this.dir, "runs"), { recursive: true });
    await this.loadWatches();
    await this.loadRuns();
  }

  // ---- watches ----

  async listWatches(): Promise<Watch[]> {
    const map = await this.loadWatches();
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }

  async getWatch(id: string): Promise<Watch | null> {
    return (await this.loadWatches()).get(id) ?? null;
  }

  async saveWatch(watch: Watch): Promise<void> {
    const map = await this.loadWatches();
    map.set(watch.id, watch);
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

  // ---- internals ----

  private async loadWatches(): Promise<Map<string, Watch>> {
    if (!this.watches) {
      const list = (await this.readJson<Watch[]>("watches.json")) ?? [];
      this.watches = new Map(list.map((w) => [w.id, w]));
    }
    return this.watches;
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
