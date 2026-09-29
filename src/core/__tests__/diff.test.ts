import { describe, expect, it } from "vitest";
import { buildFeed, countUnread, diffQuery, isUnread, mergeDiffs } from "../diff";
import type { RunRecord } from "../types";
import { snap } from "./fixtures";

const t0 = new Date("2026-09-27T10:00:00Z");
const t1 = new Date("2026-09-27T10:15:00Z");

describe("diffQuery", () => {
  it("treats the first run as a silent baseline", () => {
    const { diff, next } = diffQuery({ hash: "h", prev: null, current: [snap({ id: "a" }), snap({ id: "b" })], coveredFully: true, now: t0 });
    expect(diff).toEqual({ baseline: true, added: [], priceChanged: [], gone: [] });
    expect(Object.keys(next.seen).sort()).toEqual(["a", "b"]);
  });

  it("flags only unseen ids as new", () => {
    const first = diffQuery({ hash: "h", prev: null, current: [snap({ id: "a" })], coveredFully: true, now: t0 });
    const { diff } = diffQuery({ hash: "h", prev: first.next, current: [snap({ id: "a" }), snap({ id: "c" })], coveredFully: true, now: t1 });
    expect(diff.baseline).toBe(false);
    expect(diff.added.map((l) => l.id)).toEqual(["c"]);
  });

  it("does not re-flag an item that dropped out of the window and came back", () => {
    const r1 = diffQuery({ hash: "h", prev: null, current: [snap({ id: "a" }), snap({ id: "b" })], coveredFully: false, now: t0 });
    const r2 = diffQuery({ hash: "h", prev: r1.next, current: [snap({ id: "a" })], coveredFully: false, now: t1 });
    const r3 = diffQuery({ hash: "h", prev: r2.next, current: [snap({ id: "a" }), snap({ id: "b" })], coveredFully: false, now: t1 });
    expect(r3.diff.added).toEqual([]);
  });

  it("reports buy-now price changes but ignores auction bid movement", () => {
    const prev = diffQuery({
      hash: "h",
      prev: null,
      current: [snap({ id: "a", price: 100 }), snap({ id: "b", price: 100, type: "auction" })],
      coveredFully: true,
      now: t0,
    }).next;
    const { diff } = diffQuery({
      hash: "h",
      prev,
      current: [snap({ id: "a", price: 80 }), snap({ id: "b", price: 150, type: "auction" })],
      coveredFully: true,
      now: t1,
    });
    expect(diff.priceChanged).toHaveLength(1);
    expect(diff.priceChanged[0]).toMatchObject({ id: "a", before: 100, after: 80 });
  });

  it("only reports gone items when the run covered the full result set", () => {
    const prev = diffQuery({ hash: "h", prev: null, current: [snap({ id: "a" }), snap({ id: "b" })], coveredFully: true, now: t0 }).next;
    const partial = diffQuery({ hash: "h", prev, current: [snap({ id: "a" })], coveredFully: false, now: t1 });
    expect(partial.diff.gone).toEqual([]);
    const full = diffQuery({ hash: "h", prev, current: [snap({ id: "a" })], coveredFully: true, now: t1 });
    expect(full.diff.gone).toEqual(["b"]);
  });

  it("prunes seen ids older than the retention window", () => {
    const old = new Date("2026-06-01T00:00:00Z");
    const prev = diffQuery({ hash: "h", prev: null, current: [snap({ id: "ancient" })], coveredFully: true, now: old }).next;
    const { next } = diffQuery({ hash: "h", prev, current: [snap({ id: "fresh" })], coveredFully: true, now: t1 });
    expect(Object.keys(next.seen)).toEqual(["fresh"]);
  });
});

describe("mergeDiffs", () => {
  it("is a baseline only if every sub-query was a baseline", () => {
    const a = { baseline: true, added: [], priceChanged: [], gone: [] };
    const b = { baseline: false, added: [snap({ id: "x" })], priceChanged: [], gone: [] };
    expect(mergeDiffs([a, a]).baseline).toBe(true);
    const merged = mergeDiffs([a, b]);
    expect(merged.baseline).toBe(false);
    expect(merged.added.map((l) => l.id)).toEqual(["x"]);
  });
});

function run(overrides: Partial<RunRecord>): RunRecord {
  return {
    id: "r1",
    watchId: "w1",
    trigger: "manual",
    status: "done",
    queuedAt: t0.toISOString(),
    startedAt: t0.toISOString(),
    finishedAt: t0.toISOString(),
    requests: 1,
    baseline: false,
    total: 0,
    added: [],
    priceChanged: [],
    gone: [],
    error: null,
    ...overrides,
  };
}

describe("feed + unread", () => {
  it("lists new items and price drops, newest run first", () => {
    const l = snap({ id: "a", price: 80 });
    const runs = [
      run({ id: "old", finishedAt: t0.toISOString(), added: [snap({ id: "z" })] }),
      run({ id: "new", finishedAt: t1.toISOString(), priceChanged: [{ id: "a", before: 100, after: 80, listing: l }, { id: "b", before: 50, after: 60, listing: snap({ id: "b" }) }] }),
    ];
    const feed = buildFeed(runs, 10);
    expect(feed.map((f) => [f.kind, f.listing.id])).toEqual([
      ["PRICE_DROP", "a"],
      ["NEW", "z"],
    ]);
  });

  it("counts new items in runs finished after lastSeenAt", () => {
    const runs = [
      run({ id: "1", finishedAt: t0.toISOString(), added: [snap(), snap()] }),
      run({ id: "2", finishedAt: t1.toISOString(), added: [snap()] }),
    ];
    expect(countUnread(runs, null)).toBe(3);
    expect(countUnread(runs, "2026-09-27T10:05:00.000Z")).toBe(1);
  });

  it("treats anything after lastSeenAt, or never seen, as unread", () => {
    expect(isUnread("2026-09-27T10:05:00.000Z", null)).toBe(true);
    expect(isUnread("2026-09-27T10:05:00.000Z", "2026-09-27T10:00:00.000Z")).toBe(true);
    expect(isUnread("2026-09-27T10:05:00.000Z", "2026-09-27T10:05:00.000Z")).toBe(false);
  });
});
