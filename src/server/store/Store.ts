import type { InventorySnapshot, PortfolioData, PortfolioSnapshot, SnapshotMeta } from "@/core/portfolio";
import type { QueryState, RunRecord, Watch } from "@/core/types";

/**
 * Persistence boundary. v1 = JSON files (FileStore). A SQLite/Postgres adapter
 * implements the same interface later; nothing above this layer changes.
 */
export interface Store {
  init(): Promise<void>;

  /** In custom order (position), then by name. */
  listWatches(): Promise<Watch[]>;
  getWatch(id: string): Promise<Watch | null>;
  saveWatch(watch: Watch): Promise<void>;
  deleteWatch(id: string): Promise<void>;
  /** Store a custom order: `ids` first in that order, any others after them. */
  reorderWatches(ids: string[]): Promise<void>;

  getQueryState(hash: string): Promise<QueryState | null>;
  saveQueryStates(states: QueryState[]): Promise<void>;

  saveRun(run: RunRecord): Promise<void>;
  getRun(id: string): Promise<RunRecord | null>;
  /** Newest first. */
  listRuns(watchId: string, limit?: number): Promise<RunRecord[]>;
  /** Newest first, across all watches. */
  listAllRuns(limit?: number): Promise<RunRecord[]>;

  /** Last inventory sync; null before the first. */
  getInventory(): Promise<InventorySnapshot | null>;
  saveInventory(snapshot: InventorySnapshot): Promise<void>;
  /** Valuations and settings you entered (empty defaults before the first save). */
  getPortfolio(): Promise<PortfolioData>;
  savePortfolio(data: PortfolioData): Promise<void>;

  /** Saved portfolio snapshots, newest first. */
  listSnapshots(): Promise<SnapshotMeta[]>;
  getSnapshot(id: string): Promise<PortfolioSnapshot | null>;
  saveSnapshot(snapshot: PortfolioSnapshot): Promise<void>;
  /** False when there is no such snapshot. */
  deleteSnapshot(id: string): Promise<boolean>;
}
