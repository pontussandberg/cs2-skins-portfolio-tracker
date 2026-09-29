import type { Metadata } from "next";
import { NewWatchView } from "@/components/NewWatchView";

export const metadata: Metadata = { title: "New watch · CS2 Skins Portfolio Tracker" };

export default function NewWatchPage() {
  return <NewWatchView />;
}
