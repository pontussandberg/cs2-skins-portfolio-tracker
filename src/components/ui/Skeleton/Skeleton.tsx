"use client";

import { StyledSkeleton } from "./Skeleton.styles";

/** Loading placeholder. Give it a `height` or an `aspectRatio` (e.g. "3 / 4"). */
export function Skeleton({ height, aspectRatio }: { height?: string; aspectRatio?: string }) {
  return <StyledSkeleton style={{ height, aspectRatio }} />;
}
