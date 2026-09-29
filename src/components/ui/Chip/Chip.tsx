"use client";

import type { ReactNode } from "react";
import { Check, Chip, Group, GroupLabel } from "./Chip.styles";

/** Pill button (for a pill that opens something; ToggleChip and ChipGroup cover selection). */
export { Chip } from "./Chip.styles";

/** On/off filter pill with a check mark when on. */
export function ToggleChip({ pressed, onChange, title, children }: { pressed: boolean; onChange: (pressed: boolean) => void; title?: string; children: ReactNode }) {
  return (
    <Chip type="button" aria-pressed={pressed} title={title} onClick={() => onChange(!pressed)}>
      {pressed ? <Check aria-hidden>✓</Check> : null}
      {children}
    </Chip>
  );
}

/** A labelled row of pills where exactly one option is selected. */
export function ChipGroup<T extends string | number | null>({
  label,
  options,
  value,
  onChange,
  title,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  title?: string;
}) {
  return (
    <Group role="radiogroup" aria-label={label} title={title}>
      <GroupLabel aria-hidden>{label}</GroupLabel>
      {options.map((o) => (
        <Chip key={String(o.value)} type="button" role="radio" aria-checked={o.value === value} onClick={() => onChange(o.value)}>
          {o.label}
        </Chip>
      ))}
    </Group>
  );
}
