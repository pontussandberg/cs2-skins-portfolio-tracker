"use client";

import type { ReactNode } from "react";
import { Grid } from "./ListingGrid.styles";

/** Responsive grid of listing tiles; wrap each child in an <li>. */
export function ListingGrid({ children }: { children: ReactNode }) {
  return <Grid>{children}</Grid>;
}
