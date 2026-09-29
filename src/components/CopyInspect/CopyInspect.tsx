"use client";

import { useState } from "react";
import { ignore } from "@/lib/ignore";
import { StyledCopyButton } from "./CopyInspect.styles";

/** Copies an inspect link; raised so it stays clickable inside a clickable card. */
export function CopyInspect({ link }: { link: string | null | undefined }) {
  const [copied, setCopied] = useState(false);
  if (!link) return null;
  return (
    <StyledCopyButton
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(link).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }, ignore);
      }}
    >
      {copied ? "Copied" : "Copy inspect"}
    </StyledCopyButton>
  );
}
