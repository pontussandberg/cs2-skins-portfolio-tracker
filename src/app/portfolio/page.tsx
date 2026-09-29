import type { Metadata } from "next";
import { PortfolioView } from "@/components/PortfolioView";

export const metadata: Metadata = { title: "Portfolio · CSFloat Watcher" };

/** `?snapshot=<id>` shows a saved snapshot (history mode) instead of the live portfolio. */
export default async function PortfolioPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const { snapshot } = await searchParams;
  return <PortfolioView snapshotId={typeof snapshot === "string" ? snapshot : null} />;
}
