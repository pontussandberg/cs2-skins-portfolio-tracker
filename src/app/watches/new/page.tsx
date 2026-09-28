import type { Metadata } from "next";
import { NewWatchView } from "@/components/NewWatchView";

export const metadata: Metadata = { title: "New watch · CSFloat Watcher" };

export default function NewWatchPage() {
  return <NewWatchView />;
}
