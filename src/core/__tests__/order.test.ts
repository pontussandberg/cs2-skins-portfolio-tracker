import { describe, expect, it } from "vitest";
import { applyOrder } from "../order";

describe("applyOrder", () => {
  const items = ["a", "b", "c", "d"].map((id) => ({ id }));
  const ids = (order: string[]) => applyOrder(items, order).map((i) => i.id);

  it("puts the listed ids first, in order, and keeps the rest in place after them", () => {
    expect(ids(["c", "a"])).toEqual(["c", "a", "b", "d"]);
  });

  it("ignores unknown ids and leaves the input untouched", () => {
    expect(ids(["x", "d"])).toEqual(["d", "a", "b", "c"]);
    expect(items.map((i) => i.id)).toEqual(["a", "b", "c", "d"]);
  });
});
