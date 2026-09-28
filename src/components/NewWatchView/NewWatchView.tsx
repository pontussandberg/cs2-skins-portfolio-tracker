"use client";

import { PageHeader } from "@/components/ui";
import { WatchForm } from "@/components/WatchForm";
import { Root } from "./NewWatchView.styles";

export function NewWatchView() {
  return (
    <Root>
      <PageHeader title="New watch" description="A saved CSFloat search. The first run records a baseline; later runs flag anything new." />
      <WatchForm mode="create" />
    </Root>
  );
}
