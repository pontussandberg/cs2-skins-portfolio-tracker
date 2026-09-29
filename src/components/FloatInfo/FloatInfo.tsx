"use client";

import { formatFloat } from "@/core/format";
import { theme } from "@/styles/theme";
import { BarRoot, Column, Marker, Row, Seed, Segments, Value, WearLabel } from "./FloatInfo.styles";

// Wear ranges: Factory New, Minimal Wear, Field-Tested, Well-Worn, Battle-Scarred.
const WEAR = [
  { to: 0.07, label: "FN", color: theme.color.wear.fn },
  { to: 0.15, label: "MW", color: theme.color.wear.mw },
  { to: 0.38, label: "FT", color: theme.color.wear.ft },
  { to: 0.45, label: "WW", color: theme.color.wear.ww },
  { to: 1, label: "BS", color: theme.color.wear.bs },
];

/** Float value, wear label (FN…BS), optional seed, and a CSFloat-style float bar. */
export function FloatInfo({ value, seed }: { value: number; seed?: number | null }) {
  const wear = WEAR.find((w) => value < w.to) ?? WEAR[WEAR.length - 1]!;
  const pct = Math.min(Math.max(value, 0), 1) * 100;
  return (
    <Column>
      <Row>
        <Value>{formatFloat(value)}</Value>
        <WearLabel>
          {wear.label}
          {seed != null ? <Seed> · seed {seed}</Seed> : null}
        </WearLabel>
      </Row>
      <BarRoot aria-hidden>
        <Segments>
          {WEAR.map((w, i) => (
            <div key={w.label} style={{ width: `${(w.to - (WEAR[i - 1]?.to ?? 0)) * 100}%`, background: w.color }} />
          ))}
        </Segments>
        <Marker style={{ left: `${pct}%` }} />
      </BarRoot>
    </Column>
  );
}
