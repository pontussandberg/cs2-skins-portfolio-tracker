"use client";

import { timeAgo } from "@/core/format";
import { Badge, Spinner } from "@/components/ui";
import { SummaryText } from "./RunStatus.styles";

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
        <Spinner small /> {run?.status === "QUEUED" ? "Queued" : "Running"}
      </Badge>
    );
  }
  if (!run) return <Badge>Never run</Badge>;
  if (run.status === "FAILED")
    return (
      <Badge tone="danger" title={run.error ?? undefined}>
        Failed
      </Badge>
    );
  if (run.baseline) return <Badge tone="info">Baseline</Badge>;
  return <Badge tone="neutral">OK</Badge>;
}

export function RunSummaryLine({ run }: { run: RunView | null | undefined }) {
  if (!run) return <SummaryText>No runs yet</SummaryText>;
  if (run.status === "FAILED")
    return (
      <SummaryText $failed>
        Failed {timeAgo(run.finishedAt)}: {run.error}
      </SummaryText>
    );
  if (run.status !== "DONE") return <SummaryText>Started {timeAgo(run.startedAt ?? run.queuedAt)}</SummaryText>;
  if (run.baseline)
    return (
      <SummaryText>
        Baseline of {run.total} listings, {timeAgo(run.finishedAt)}
      </SummaryText>
    );
  const drops = run.priceChanges.filter((p) => p.after < p.before).length;
  return (
    <SummaryText>
      {run.added.length} new · {drops} price drop{drops === 1 ? "" : "s"} · {run.goneIds.length} gone · {timeAgo(run.finishedAt)}
    </SummaryText>
  );
}
