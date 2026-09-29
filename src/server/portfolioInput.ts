import { z } from "zod";
import type { PortfolioSettings, ValuationInput } from "@/core/portfolio";
import { parseInput } from "./watchInput";

// Null (or omitted) clears a field.
const ValuationInputSchema = z.object({
  craftPercent: z.number().min(0).max(1000).nullish(),
  multiplier: z.number().positive().max(1000).nullish(),
  skinPrice: z.number().int().min(0).max(100_000_000).nullish(),
  note: z.string().trim().max(500).nullish(),
});

const SettingsInputSchema = z.object({
  defaultCraftPercent: z.number().min(0).max(1000),
});

const SnapshotLabelSchema = z.string().trim().max(80).nullish();

/** Empty = no label. */
export function normalizeSnapshotLabel(raw: unknown): string | null {
  return parseInput(SnapshotLabelSchema, raw) || null;
}

export function normalizeValuationInput(raw: unknown): ValuationInput {
  const v = parseInput(ValuationInputSchema, raw);
  return { craftPercent: v.craftPercent ?? null, multiplier: v.multiplier ?? null, skinPrice: v.skinPrice ?? null, note: v.note || null };
}

export function normalizeSettingsInput(raw: unknown): PortfolioSettings {
  return parseInput(SettingsInputSchema, raw);
}
