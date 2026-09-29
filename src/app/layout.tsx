import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import { ApolloWrapper } from "@/lib/apollo/ApolloWrapper";
import { StyledComponentsRegistry } from "@/lib/StyledComponentsRegistry";
import { theme } from "@/styles/theme";

export const metadata: Metadata = {
  title: "CS2 Skins Portfolio Tracker",
  description: "Your CS2 skin portfolio and saved CSFloat searches that tell you what's new.",
};

export const viewport: Viewport = {
  themeColor: theme.color.canvas,
};

// Everything is live data from this server; never prerender at build time.
export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <StyledComponentsRegistry>
          <ApolloWrapper>
            <AppShell>{children}</AppShell>
          </ApolloWrapper>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
