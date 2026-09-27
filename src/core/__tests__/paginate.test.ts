import { describe, expect, it } from "vitest";
import { paginate, type Page } from "../paginate";
import { snap } from "./fixtures";

function pages(...ids: string[][]): (cursor: string | null) => Promise<Page> {
  return async (cursor) => {
    const i = cursor ? Number(cursor) : 0;
    const items = (ids[i] ?? []).map((id) => snap({ id }));
    return { items, cursor: i + 1 < ids.length ? String(i + 1) : null };
  };
}

const size = 2;

describe("paginate", () => {
  it("covers the full result set when the last page ends", async () => {
    const r = await paginate(pages(["a", "b"], ["c"]), { maxPages: 5, pageSize: size, knownIds: null });
    expect(r.items.map((l) => l.id)).toEqual(["a", "b", "c"]);
    expect(r).toMatchObject({ pages: 2, coveredFully: true, stoppedBecause: "end" });
  });

  it("stops early when a full page is entirely known", async () => {
    const r = await paginate(pages(["new", "a"], ["b", "c"], ["d", "e"], ["f"]), {
      maxPages: 5,
      pageSize: size,
      knownIds: new Set(["a", "b", "c", "d", "e", "f"]),
    });
    expect(r).toMatchObject({ pages: 2, coveredFully: false, stoppedBecause: "known" });
  });

  it("respects maxPages", async () => {
    const r = await paginate(pages(["a", "b"], ["c", "d"], ["e", "f"]), { maxPages: 2, pageSize: size, knownIds: null });
    expect(r).toMatchObject({ pages: 2, coveredFully: false, stoppedBecause: "maxPages" });
  });
});
