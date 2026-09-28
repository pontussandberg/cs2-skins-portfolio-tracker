"use client";

import { StyledErrorNote } from "./ErrorNote.styles";

export function ErrorNote({ error }: { error: { message: string } | null | undefined }) {
  if (!error) return null;
  return <StyledErrorNote role="alert">{error.message}</StyledErrorNote>;
}
