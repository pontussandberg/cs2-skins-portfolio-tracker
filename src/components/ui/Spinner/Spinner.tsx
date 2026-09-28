"use client";

import { StyledSpinner } from "./Spinner.styles";

export function Spinner({ small }: { small?: boolean }) {
  return <StyledSpinner aria-hidden $small={small} />;
}
