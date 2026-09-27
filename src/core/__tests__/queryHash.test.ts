import { describe, expect, it } from "vitest";
import { buildSubQueries, canonicalJson, subQueryHash } from "../queryHash";

describe("canonicalJson", () => {
  it("sorts keys and drops empty values", () => {
    expect(canonicalJson({ b: 1, a: "x", c: null, d: undefined, e: "" })).toBe('{"a":"x","b":1}');
  });
});

describe("buildSubQueries", () => {
  const query = { def_index: 7, paint_index: 44, max_price: 500000 };

  it("fans out one sub-query per unique seed, sorted", () => {
    const subs = buildSubQueries({ query, seeds: [670, 661, 670] });
    expect(subs.map((s) => s.seed)).toEqual([661, 670]);
    expect(subs[0]!.params).toMatchObject({ def_index: 7, paint_index: 44, paint_seed: 661, sort_by: "most_recent", limit: 50 });
  });

  it("uses a single sub-query without seeds", () => {
    const subs = buildSubQueries({ query, seeds: [] });
    expect(subs).toHaveLength(1);
    expect(subs[0]!.params).not.toHaveProperty("paint_seed");
  });

  it("gives equal filters equal hashes regardless of key order", () => {
    expect(subQueryHash({ paint_index: 44, def_index: 7 }, 661)).toBe(subQueryHash({ def_index: 7, paint_index: 44 }, 661));
  });

  it("changes the hash when filters or seed change", () => {
    const h = subQueryHash(query, 661);
    expect(subQueryHash(query, 670)).not.toBe(h);
    expect(subQueryHash({ ...query, max_price: 400000 }, 661)).not.toBe(h);
  });

  it("keeps existing seed hashes when a seed is added to the watch", () => {
    const before = buildSubQueries({ query, seeds: [661] });
    const after = buildSubQueries({ query, seeds: [661, 955] });
    expect(after.find((s) => s.seed === 661)!.hash).toBe(before[0]!.hash);
  });

  it("treats category 0 (any) like no category", () => {
    expect(subQueryHash({ ...query, category: 0 }, null)).toBe(subQueryHash(query, null));
  });
});
