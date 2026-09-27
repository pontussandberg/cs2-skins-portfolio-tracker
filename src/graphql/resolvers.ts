import { GraphQLError } from "graphql";
import { buildCsfloatSearchUrl } from "@/core/csfloatUrl";
import { buildFeed, countUnread, dedupeById } from "@/core/diff";
import { iconUrl, listingUrl } from "@/core/format";
import { buildSubQueries } from "@/core/queryHash";
import type { RunRecord, Watch } from "@/core/types";
import type { WatchInputError } from "@/server/watchInput";
import type { Resolvers } from "./__generated__/resolvers-types";

function userError(err: unknown): never {
  // Match by name: the runtime is created from instrumentation.ts, which Next bundles separately,
  // so `instanceof` against this bundle's class would be false.
  if (err instanceof Error && err.name === "WatchInputError") {
    throw new GraphQLError(err.message, { extensions: { code: "BAD_USER_INPUT", issues: (err as WatchInputError).issues } });
  }
  if (err instanceof Error) throw new GraphQLError(err.message, { extensions: { code: "BAD_REQUEST" } });
  throw err;
}

async function requireWatch(rt: { store: { getWatch(id: string): Promise<Watch | null> } }, id: string): Promise<Watch> {
  const watch = await rt.store.getWatch(id);
  if (!watch) throw new GraphQLError("Watch not found", { extensions: { code: "NOT_FOUND" } });
  return watch;
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
  },

  Mutation: {
    createWatch: (_p, { input }, { rt }) => rt.createWatch(input).catch(userError),
    updateWatch: (_p, { id, input }, { rt }) => rt.updateWatch(id, input).catch(userError),
    deleteWatch: (_p, { id }, { rt }) => rt.deleteWatch(id),
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
  },

  Watch: {
    unreadCount: async (w, _a, { rt }) => countUnread(await rt.store.listRuns(w.id), w.lastSeenAt),
    isRunning: (w, _a, { rt }) => rt.queue.isActive(w.id),
    nextRunAt: (w, _a, { rt }) => rt.scheduler.nextRunAt(w.id),
    lastRun: async (w, _a, { rt }) => (await rt.store.listRuns(w.id, 1))[0] ?? null,
    runs: (w, { limit }, { rt }) => rt.store.listRuns(w.id, Math.min(Math.max(limit ?? 20, 1), 200)),
    currentListings: async (w, _a, { rt }) => {
      const states = await Promise.all(buildSubQueries(w).map((s) => rt.store.getQueryState(s.hash)));
      const all = dedupeById(states.flatMap((s) => s?.lastSnapshot ?? []));
      return all.sort((a, b) => (b.createdAt < a.createdAt ? -1 : b.createdAt > a.createdAt ? 1 : 0));
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
  },

  FeedItem: {
    watch: (f, _a, { rt }) => rt.store.getWatch(f.watchId),
  },
};
