import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { RunRecord, Watch } from "@/core/types";
import { FileStore } from "../FileStore";

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), "cfw-"));
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

const watch: Watch = {
  id: "w1",
  name: "Blue gems",
  query: { def_index: 7, paint_index: 44 },
  seeds: [661],
  schedule: null,
  maxPages: 3,
  enabled: true,
  notify: true,
  createdAt: "2026-09-27T10:00:00.000Z",
  updatedAt: "2026-09-27T10:00:00.000Z",
  lastSeenAt: null,
};

function run(id: string, queuedAt: string): RunRecord {
  return {
    id,
    watchId: "w1",
    trigger: "manual",
    status: "done",
    queuedAt,
    startedAt: queuedAt,
    finishedAt: queuedAt,
    requests: 1,
    baseline: false,
    total: 0,
    added: [],
    priceChanged: [],
    gone: [],
    error: null,
  };
}

describe("FileStore", () => {
  it("persists watches, states and runs across instances", async () => {
    const a = new FileStore(dir);
    await a.init();
    await a.saveWatch(watch);
    await a.saveQueryStates([{ hash: "abc", lastSnapshot: [], coveredFully: true, seen: { x: "t" }, lastRunAt: "t" }]);
    await a.saveRun(run("r1", "2026-09-27T10:00:00.000Z"));
    await a.saveRun(run("r2", "2026-09-27T11:00:00.000Z"));
    await a.saveRun({ ...run("r1", "2026-09-27T10:00:00.000Z"), status: "failed" });

    const b = new FileStore(dir);
    await b.init();
    expect(await b.getWatch("w1")).toEqual(watch);
    expect((await b.getQueryState("abc"))?.seen).toEqual({ x: "t" });
    expect((await b.listRuns("w1")).map((r) => [r.id, r.status])).toEqual([
      ["r2", "done"],
      ["r1", "failed"],
    ]);
    expect((await b.getRun("r1"))?.status).toBe("failed");
  });

  it("deletes a watch and its runs", async () => {
    const s = new FileStore(dir);
    await s.init();
    await s.saveWatch(watch);
    await s.saveRun(run("r1", "2026-09-27T10:00:00.000Z"));
    await s.deleteWatch("w1");
    const fresh = new FileStore(dir);
    await fresh.init();
    expect(await fresh.listWatches()).toEqual([]);
    expect(await fresh.listRuns("w1")).toEqual([]);
  });
});
