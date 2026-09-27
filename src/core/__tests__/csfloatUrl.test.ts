import { describe, expect, it } from "vitest";
import { buildCsfloatSearchUrl, parseCsfloatSearchUrl, parseSeedList } from "../csfloatUrl";

describe("parseCsfloatSearchUrl", () => {
  it("maps known params and collects seeds", () => {
    const r = parseCsfloatSearchUrl(
      "https://csfloat.com/search?def_index=7&paint_index=44&paint_seed=661&paint_seed=670,321&max_float=0.38&category=1&type=buy_now&sort_by=lowest_price&foo=bar",
    );
    expect(r.query).toEqual({ def_index: 7, paint_index: 44, max_float: 0.38, category: 1, type: "buy_now" });
    expect(r.seeds).toEqual([321, 661, 670]);
    expect(r.ignored).toEqual(["foo"]);
  });

  it("accepts a bare query string", () => {
    expect(parseCsfloatSearchUrl("market_hash_name=AK-47%20%7C%20Redline%20(Field-Tested)").query).toEqual({
      market_hash_name: "AK-47 | Redline (Field-Tested)",
    });
  });

  it("round-trips through buildCsfloatSearchUrl", () => {
    const url = buildCsfloatSearchUrl({ def_index: 7, paint_index: 44, max_price: 100000 }, 661);
    const r = parseCsfloatSearchUrl(url);
    expect(r.query).toEqual({ def_index: 7, paint_index: 44, max_price: 100000 });
    expect(r.seeds).toEqual([661]);
  });
});

describe("parseSeedList", () => {
  it("accepts commas, spaces and newlines, dedupes and sorts", () => {
    expect(parseSeedList("661, 670 321\n955,661 x")).toEqual([321, 661, 670, 955]);
  });
});
