import type { Metadata } from "next";
import { WatchForm } from "@/components/WatchForm";

export const metadata: Metadata = { title: "New watch · CSFloat Watcher" };

export default function NewWatchPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">New watch</h1>
      <p className="mb-6 text-sm text-ink-muted">A saved CSFloat search. The first run records a baseline; later runs flag anything new.</p>
      <WatchForm mode="create" />
    </div>
  );
}
