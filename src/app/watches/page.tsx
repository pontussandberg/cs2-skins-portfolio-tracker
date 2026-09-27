import type { Metadata } from "next";
import { WatchesView } from "@/components/WatchesView";

export const metadata: Metadata = { title: "Watches · CSFloat Watcher" };

export default function WatchesPage() {
  return <WatchesView />;
}
