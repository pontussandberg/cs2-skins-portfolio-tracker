import { EmptyState, LinkButton } from "@/components/ui";

export default function NotFound() {
  return <EmptyState title="Page not found" action={<LinkButton href="/">Back to the feed</LinkButton>} />;
}
