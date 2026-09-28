"use client";

import type { ReactNode } from "react";
import { LiveUpdates } from "@/components/LiveUpdates";
import { Nav } from "@/components/Nav";
import { Main } from "./AppShell.styles";

/** Header, page content and live-update toasts. */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      <Nav />
      <Main>{children}</Main>
      <LiveUpdates />
    </>
  );
}
