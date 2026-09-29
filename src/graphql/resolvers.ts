import { GraphQLError } from "graphql";
import { buildCsfloatSearchUrl } from "@/core/csfloatUrl";
import { buildFeed, countUnread, dedupeById } from "@/core/diff";
import { baseItemName, iconUrl, listingUrl } from "@/core/format";
import { sortListings, stickerPercent, stickersOf } from "@/core/listing";
import { buildPortfolio, type InventorySnapshot, type PortfolioData, type SnapshotMeta } from "@/core/portfolio";
import { buildSubQueries } from "@/core/queryHash";
import { sortOf, type ListingSnap, type RunRecord, type Watch } from "@/core/types";
import type { InputError } from "@/server/watchInput";
import type { Resolvers } from "./__generated__/resolvers-types";
import type { GqlContext, PortfolioModel } from "./context";

function userError(err: unknown): never {
  // Match by name: the runtime is created from instrumentation.ts, which Next bundles separately,
  // so `instanceof` against this bundle's class would be false.
  if (err instanceof Error && err.name === "InputError") {
    throw new GraphQLError(err.message, { extensions: { code: "BAD_USER_INPUT", issues: (err as InputError).issues } });
  }
  if (err instanceof Error) throw new GraphQLError(err.message, { extensions: { code: "BAD_REQUEST" } });
  throw err;
}

async function requireWatch(rt: { store: { getWatch(id: string): Promise<Watch | null> } }, id: string): Promise<Watch> {
  const watch = await rt.store.getWatch(id);
  if (!watch) throw new GraphQLError("Watch not found", { extensions: { code: "NOT_FOUND" } });
  return watch;
}

/** Union of the latest snapshot of every seed, read once per request. */
function latestListings({ rt, listings }: GqlContext, w: Watch): Promise<ListingSnap[]> {
  let cached = listings.get(w.id);
  if (!cached) {
    cached = Promise.all(buildSubQueries(w).map((s) => rt.store.getQueryState(s.hash))).then((states) =>
      dedupeById(states.flatMap((s) => s?.lastSnapshot ?? [])),
    );
    listings.set(w.id, cached);
  }
  return cached;
}

function portfolioModel(inventory: InventorySnapshot | null, data: PortfolioData, snapshot: SnapshotMeta | null = null): PortfolioModel {
  const id = snapshot ? `snapshot:${snapshot.id}` : "portfolio";
  const entries = buildPortfolio(inventory?.items ?? [], data).map((e) => ({ ...e, portfolioId: id }));
  return { id, snapshot, syncedAt: inventory?.syncedAt ?? null, settings: data.settings, entries };
}

/** The saved inventory (without triggering a sync) with `data`. */
async function currentPortfolio(rt: GqlContext["rt"], data?: PortfolioData): Promise<PortfolioModel> {
  const [inventory, portfolio] = await Promise.all([rt.store.getInventory(), data ?? rt.store.getPortfolio()]);
  return portfolioModel(inventory, portfolio);
}

const RUN_STATUS = { queued: "QUEUED", running: "RUNNING", done: "DONE", failed: "FAILED" } as const;

export const resolvers: Resolvers = {
  Query: {
    watches: (_p, _a, { rt }) => rt.store.listWatches(),
    watch: (_p, { id }, { rt }) => rt.store.getWatch(id),
    run: (_p, { id }, { rt }) => rt.store.getRun(id),
    feed: async (_p, { limit }, { rt }) => {
      const n = Math.min(Math.max(limit ?? 100, 1), 500);
      return buildFeed(await rt.store.listAllRuns(), n);
    },
    system: (_p, _a, { rt }) => rt.status(),
    portfolio: async (_p, _a, { rt }) => {
      const [inventory, data] = await Promise.all([rt.getInventory(), rt.store.getPortfolio()]);
      return portfolioModel(inventory, data);
    },
    portfolioSnapshot: async (_p, { id }, { rt }) => {
      const s = await rt.store.getSnapshot(id);
      return s ? portfolioModel(s.inventory, s.portfolio, s) : null;
    },
    portfolioSnapshots: (_p, _a, { rt }) => rt.store.listSnapshots(),
  },

  Mutation: {
    createWatch: (_p, { input }, { rt }) => rt.createWatch(input).catch(userError),
    updateWatch: (_p, { id, input }, { rt }) => rt.updateWatch(id, input).catch(userError),
    deleteWatch: (_p, { id }, { rt }) => rt.deleteWatch(id),
    reorderWatches: (_p, { ids }, { rt }) => rt.reorderWatches(ids).catch(userError),
    runWatch: async (_p, { id }, { rt }) => {
      await requireWatch(rt, id);
      return rt.queue.enqueue(id, "manual");
    },
    runAll: async (_p, _a, { rt }) => {
      const runs: RunRecord[] = [];
      for (const w of await rt.store.listWatches()) {
        if (w.enabled) runs.push(await rt.queue.enqueue(w.id, "manual"));
      }
      return runs;
    },
    markWatchSeen: (_p, { id }, { rt }) => rt.markWatchSeen(id).catch(userError),
    markAllSeen: async (_p, _a, { rt }) => {
      for (const w of await rt.store.listWatches()) await rt.markWatchSeen(w.id);
      return true;
    },
    sendTestNotification: async (_p, _a, { rt }) => {
      await rt.notifier.sendTest().catch(userError);
      return true;
    },
    resumeScheduler: (_p, _a, { rt }) => {
      rt.scheduler.resume();
      return rt.status();
    },
    syncInventory: async (_p, _a, { rt }) => portfolioModel(await rt.syncInventory().catch(userError), await rt.store.getPortfolio()),
    setValuation: async (_p, { key, input }, { rt }) => currentPortfolio(rt, await rt.setValuation(key, input).catch(userError)),
    takePortfolioSnapshot: (_p, { label }, { rt }) => rt.takeSnapshot(label).catch(userError),
    deletePortfolioSnapshot: (_p, { id }, { rt }) => rt.deleteSnapshot(id),
    setPortfolioSettings: async (_p, { input }, { rt }) => currentPortfolio(rt, await rt.setPortfolioSettings(input).catch(userError)),
  },

  Portfolio: {
    syncing: (p, _a, { rt }) => !p.snapshot && rt.inventoryStatus().syncing,
    syncError: (p, _a, { rt }) => (p.snapshot ? null : rt.inventoryStatus().error),
    items: (p) => p.entries,
  },

  PortfolioItem: {
    id: (e) => `${e.portfolioId}/${e.key}`,
    iconUrl: (e) => iconUrl(e.iconUrl),
    csfloatUrl: (e) => (e.listingId ? listingUrl(e.listingId) : null),
  },

  Watch: {
    unreadCount: async (w, _a, { rt }) => countUnread(await rt.store.listRuns(w.id), w.lastSeenAt),
    isRunning: (w, _a, { rt }) => rt.queue.isActive(w.id),
    nextRunAt: (w, _a, { rt }) => rt.scheduler.nextRunAt(w.id),
    lastRun: async (w, _a, { rt }) => (await rt.store.listRuns(w.id, 1))[0] ?? null,
    runs: (w, { limit }, { rt }) => rt.store.listRuns(w.id, Math.min(Math.max(limit ?? 20, 1), 200)),
    currentListings: async (w, _a, ctx) => sortListings(await latestListings(ctx, w), sortOf(w.query)),
    itemName: async (w, _a, ctx) => {
      if (w.query.market_hash_name) return baseItemName(w.query.market_hash_name);
      // Without a weapon/skin filter (e.g. sticker-only) listings are unrelated items.
      if (w.query.def_index == null || w.query.paint_index == null) return null;
      const first = (await latestListings(ctx, w))[0];
      return first ? baseItemName(first.name) : null;
    },
    csfloatSearchUrl: (w) => buildCsfloatSearchUrl(w.query, w.seeds.length === 1 ? w.seeds[0] : null),
  },

  Run: {
    trigger: (r) => (r.trigger === "cron" ? "CRON" : "MANUAL"),
    status: (r) => RUN_STATUS[r.status],
    priceChanges: (r) => r.priceChanged,
    goneIds: (r) => r.gone,
  },

  Listing: {
    csfloatUrl: (l) => listingUrl(l.id),
    iconUrl: (l) => iconUrl(l.iconUrl),
    stickerDetails: (l) => stickersOf(l),
    stickerPercent: (l) => stickerPercent(l),
  },

  FeedItem: {
    watch: (f, _a, { rt }) => rt.store.getWatch(f.watchId),
  },
};
