"use client";

import { timeAgo } from "@/core/format";
import { Badge, Spinner } from "./ui";

export interface RunView {
  id: string;
  trigger: string;
  status: string;
  queuedAt: string;
  startedAt?: string | null;
  finishedAt?: string | null;
  requests: number;
  baseline: boolean;
  total: number;
  error?: string | null;
  added: { id: string }[];
  priceChanges: { before: number; after: number }[];
  goneIds: string[];
}

export function RunStatusBadge({ run, running }: { run: RunView | null | undefined; running?: boolean }) {
  if (running || run?.status === "RUNNING" || run?.status === "QUEUED") {
    return (
      <Badge tone="accent">
        <Spinner className="size-3" /> {run?.status === "QUEUED" ? "Queued" : "Running"}
      </Badge>
    );
  }
  if (!run) return <Badge>Never run</Badge>;
  if (run.status === "FAILED") return <Badge tone="peach" title={run.error ?? undefined}>Failed</Badge>;
  if (run.baseline) return <Badge tone="lilac">Baseline</Badge>;
  return <Badge tone="neutral">OK</Badge>;
}

export function RunSummaryLine({ run }: { run: RunView | null | undefined }) {
  if (!run) return <span className="text-ink-muted">No runs yet</span>;
  if (run.status === "FAILED") return <span className="text-peach-ink">Failed {timeAgo(run.finishedAt)}: {run.error}</span>;
  if (run.status !== "DONE") return <span className="text-ink-muted">Started {timeAgo(run.startedAt ?? run.queuedAt)}</span>;
  if (run.baseline) return <span className="text-ink-muted">Baseline of {run.total} listings, {timeAgo(run.finishedAt)}</span>;
  const drops = run.priceChanges.filter((p) => p.after < p.before).length;
  return (
    <span className="text-ink-muted">
      {run.added.length} new · {drops} price drop{drops === 1 ? "" : "s"} · {run.goneIds.length} gone · {timeAgo(run.finishedAt)}
    </span>
  );
}
