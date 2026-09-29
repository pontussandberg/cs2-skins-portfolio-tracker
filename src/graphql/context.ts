import type { PortfolioEntry, PortfolioSettings, SnapshotMeta } from "@/core/portfolio";
import type { ListingSnap } from "@/core/types";
import type { Runtime } from "@/server/runtime";

export interface GqlContext {
  rt: Runtime;
  /** Per-request cache of each watch's latest listings (watch id -> listings). */
  listings: Map<string, Promise<ListingSnap[]>>;
}

/** Resolver model for PortfolioItem: an entry plus the id of the portfolio it belongs to. */
export interface PortfolioItemModel extends PortfolioEntry {
  portfolioId: string;
}

/** Resolver model for the Portfolio type. */
export interface PortfolioModel {
  /** "portfolio" for the live one, "snapshot:<id>" for a snapshot. */
  id: string;
  /** Set for a saved snapshot. */
  snapshot: SnapshotMeta | null;
  syncedAt: string | null;
  settings: PortfolioSettings;
  entries: PortfolioItemModel[];
}
