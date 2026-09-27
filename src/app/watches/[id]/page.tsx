import { WatchDetailView } from "@/components/WatchDetailView";

export default async function WatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <WatchDetailView id={id} />;
}
