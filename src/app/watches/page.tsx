import type { Metadata } from "next";
import { WatchesView } from "@/components/WatchesView";

export const metadata: Metadata = { title: "Watches · CS2 Skins Portfolio Tracker" };

export default function WatchesPage() {
  return <WatchesView />;
}
