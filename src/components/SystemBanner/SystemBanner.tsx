"use client";

import { useMutation } from "@apollo/client/react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui";
import { RESUME_SCHEDULER } from "@/graphql/operations";
import { ignore } from "@/lib/ignore";
import { Note, Stack } from "./SystemBanner.styles";

export interface SystemView {
  csfloatKeyConfigured: boolean;
  discordConfigured: boolean;
  schedulerSuspended: boolean;
  suspendedReason?: string | null;
}

/** Surfaces setup problems: missing API key, paused scheduler. */
export function SystemBanner({ system }: { system: SystemView | null | undefined }) {
  const [resume, { loading }] = useMutation(RESUME_SCHEDULER);
  if (!system) return null;
  const notes: { key: string; text: string; action?: ReactNode }[] = [];
  if (!system.csfloatKeyConfigured) {
    notes.push({ key: "key", text: "CSFLOAT_API_KEY is not set in .env.local, so runs will fail. Add it and restart the app." });
  }
  if (system.schedulerSuspended) {
    notes.push({
      key: "sched",
      text: `Scheduled runs are paused: ${system.suspendedReason ?? "unknown reason"}`,
      action: (
        <Button size="sm" tone="neutral" busy={loading} onClick={() => resume().catch(ignore)}>
          Resume
        </Button>
      ),
    });
  }
  if (notes.length === 0) return null;
  return (
    <Stack>
      {notes.map((n) => (
        <Note key={n.key} role="status">
          <span>{n.text}</span>
          {n.action}
        </Note>
      ))}
    </Stack>
  );
}
