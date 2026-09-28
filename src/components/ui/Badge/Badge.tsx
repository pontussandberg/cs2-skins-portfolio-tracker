"use client";

import type { ReactNode } from "react";
import { StyledBadge, type BadgeTone } from "./Badge.styles";

export type { BadgeTone };

/** Small status label. `caps={false}` keeps the text as written (e.g. "#32 low"). */
export function Badge({
  tone = "neutral",
  caps = true,
  pulse,
  title,
  children,
}: {
  tone?: BadgeTone;
  caps?: boolean;
  pulse?: boolean;
  title?: string;
  children: ReactNode;
}) {
  return (
    <StyledBadge title={title} $tone={tone} $caps={caps} $pulse={pulse}>
      {children}
    </StyledBadge>
  );
}
