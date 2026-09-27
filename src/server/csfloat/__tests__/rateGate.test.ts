import { describe, expect, it } from "vitest";
import { parseResetHeader, RateGate } from "../rateGate";

function fakeClock() {
  let t = 1_000_000;
  const sleeps: number[] = [];
  return {
    now: () => t,
    sleep: async (ms: number) => {
      sleeps.push(ms);
      t += ms;
    },
    sleeps,
  };
}

describe("RateGate", () => {
  it("spaces requests by the minimum interval", async () => {
    const c = fakeClock();
    const gate = new RateGate(2000, c.sleep, c.now);
    await Promise.all([gate.acquire(), gate.acquire(), gate.acquire()]);
    expect(c.sleeps).toEqual([2000, 2000]);
  });

  it("waits out a pause", async () => {
    const c = fakeClock();
    const gate = new RateGate(100, c.sleep, c.now);
    gate.pauseUntil(c.now() + 60_000);
    await gate.acquire();
    expect(c.sleeps).toEqual([60_000]);
  });
});

describe("parseResetHeader", () => {
  const now = 1_700_000_000_000;
  it("handles epoch seconds, epoch ms and deltas", () => {
    expect(parseResetHeader("1700000060", now)).toBe(1_700_000_060_000);
    expect(parseResetHeader("1700000060000", now)).toBe(1_700_000_060_000);
    expect(parseResetHeader("30", now)).toBe(now + 30_000);
    expect(parseResetHeader(null, now)).toBeNull();
  });
});
