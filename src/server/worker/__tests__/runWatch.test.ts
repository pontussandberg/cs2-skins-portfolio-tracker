import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { snap } from "@/core/__tests__/fixtures";
import type { Page } from "@/core/paginate";
import { PAGE_LIMIT } from "@/core/queryHash";
import type { ListingSnap, RunRecord, Watch } from "@/core/types";
import { CsfloatAuthError } from "../../csfloat/errors";
import { EventBus, type AppEvent } from "../../events";
import { FileStore } from "../../store/FileStore";
import { executeRun, type WorkerDeps } from "../runWatch";

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), "cfw-run-"));
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

const silent = { child: () => silent, info: () => {}, debug: () => {}, warn: () => {}, error: () => {} };

const watch: Watch = {
  id: "w1",
  name: "AK CH blue gems",
  query: { def_index: 7, paint_index: 44 },
  seeds: [661, 670],
  schedule: null,
  maxPages: 3,
  enabled: true,
  notify: true,
  createdAt: "2026-09-27T10:00:00.000Z",
  updatedAt: "2026-09-27T10:00:00.000Z",
  lastSeenAt: null,
};

/** Fake CSFloat: listings per seed, single page each. */
function fakeClient(bySeed: Record<number, ListingSnap[]>, fail?: Error) {
  return {
    requestCount: 0,
    async fetchListingsPage(params: Record<string, string | number>): Promise<Page> {
      this.requestCount += 1;
      if (fail) throw fail;
      return { items: bySeed[Number(params.paint_seed)] ?? [], cursor: null };
    },
  };
}

type TestClient = {
  requestCount: number;
  fetchListingsPage(params: Record<string, string | number>, cursor: string | null): Promise<Page>;
};

async function setup(client: TestClient, w: Watch = watch) {
  const store = new FileStore(dir);
  await store.init();
  await store.saveWatch(w);
  const events: AppEvent[] = [];
  const bus = new EventBus();
  bus.subscribe((e) => events.push(e));
  const notified: ListingSnap[][] = [];
  const authErrors: string[] = [];
  const deps = {
    store,
    client,
    bus,
    logger: silent,
    notifier: { notifyNewItems: async (_w: unknown, items: ListingSnap[]) => void notified.push(items) },
    onAuthError: (m: string) => void authErrors.push(m),
  } as unknown as WorkerDeps;
  return { store, deps, events, notified, authErrors };
}

async function queueRun(store: FileStore, id: string): Promise<void> {
  const run: RunRecord = {
    id,
    watchId: "w1",
    trigger: "manual",
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
  await store.saveRun(run);
}

describe("executeRun", () => {
  it("baselines first, then flags only new listings and notifies Discord", async () => {
    const listings: Record<number, ListingSnap[]> = { 661: [snap({ id: "a", seed: 661 })], 670: [snap({ id: "b", seed: 670 })] };
    const client = fakeClient(listings);
    const { store, deps, events, notified } = await setup(client);

    await queueRun(store, "r1");
    const first = await executeRun(deps, "r1");
    expect(first).toMatchObject({ status: "done", baseline: true, total: 2, requests: 2 });
    expect(first!.added).toEqual([]);
    expect(notified).toEqual([]);

    listings[670] = [snap({ id: "c", seed: 670 }), ...listings[670]!];
    await queueRun(store, "r2");
    const second = await executeRun(deps, "r2");
    expect(second).toMatchObject({ status: "done", baseline: false, total: 3 });
    expect(second!.added.map((l) => l.id)).toEqual(["c"]);
    expect(notified.map((items) => items.map((l) => l.id))).toEqual([["c"]]);
    expect(events.filter((e) => e.type === "run.finished")).toHaveLength(2);
  });

  it("marks the run failed, keeps the baseline, and reports auth errors", async () => {
    const good = fakeClient({ 661: [snap({ id: "a" })] });
    const { store, deps } = await setup(good);
    await queueRun(store, "r1");
    await executeRun(deps, "r1");

    const bad = fakeClient({}, new CsfloatAuthError("bad key"));
    const failing = await setup(bad);
    await queueRun(failing.store, "r2");
    const result = await executeRun(failing.deps, "r2");
    expect(result).toMatchObject({ status: "failed", error: "bad key" });
    expect(failing.authErrors).toEqual(["bad key"]);

    // Next good run still diffs against the original baseline: nothing new.
    await queueRun(store, "r3");
    const after = await executeRun(deps, "r3");
    expect(after).toMatchObject({ status: "done", baseline: false });
    expect(after!.added).toEqual([]);
  });

  it("fetches the whole window for ranked sorts, so a new listing behind a known page is found", async () => {
    const ranked: Watch = { ...watch, query: { def_index: 500, paint_index: 40, sort_by: "lowest_float" }, seeds: [], maxPages: 3 };
    const page = (prefix: string) => Array.from({ length: PAGE_LIMIT }, (_, i) => snap({ id: `${prefix}${i}` }));
    let pages = [page("p1-"), page("p2-")];
    const client = {
      requestCount: 0,
      async fetchListingsPage(params: Record<string, string | number>, cursor: string | null): Promise<Page> {
        this.requestCount += 1;
        expect(params.sort_by).toBe("lowest_float");
        const i = cursor ? Number(cursor) : 0;
        return { items: pages[i] ?? [], cursor: i + 1 < pages.length ? String(i + 1) : null };
      },
    };
    const { store, deps } = await setup(client, ranked);

    await queueRun(store, "r1");
    expect(await executeRun(deps, "r1")).toMatchObject({ status: "done", baseline: true, requests: 2 });

    // Page 1 is unchanged (all known); a new low float appears on page 2.
    pages = [pages[0]!, [snap({ id: "fresh" }), ...pages[1]!.slice(1)]];
    await queueRun(store, "r2");
    const second = await executeRun(deps, "r2");
    expect(second).toMatchObject({ status: "done", requests: 2 });
    expect(second!.added.map((l) => l.id)).toEqual(["fresh"]);
  });
});
