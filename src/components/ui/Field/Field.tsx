"use client";

import type { ReactNode } from "react";
import { Hint, Label, Wrapper } from "./Field.styles";

/** Label + control + optional hint. `wide` spans both columns of a two-column form grid. */
export function Field({
  label,
  hint,
  htmlFor,
  wide,
  children,
}: {
  label: string;
  hint?: ReactNode;
  htmlFor?: string;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <Wrapper $wide={wide}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint ? <Hint>{hint}</Hint> : null}
    </Wrapper>
  );
}
