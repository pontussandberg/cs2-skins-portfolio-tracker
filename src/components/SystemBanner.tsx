"use client";

import { useMutation } from "@apollo/client/react";
import type { ReactNode } from "react";
import { RESUME_SCHEDULER } from "@/graphql/operations";
import { Button } from "./ui";
import { ignore } from "@/lib/ignore";

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
    <div className="mb-6 flex flex-col gap-3">
      {notes.map((n) => (
        <div key={n.key} role="status" className="clay flex flex-wrap items-center justify-between gap-3 bg-lemon px-5 py-4 text-sm font-semibold text-lemon-ink">
          <span>{n.text}</span>
          {n.action}
        </div>
      ))}
    </div>
  );
}
