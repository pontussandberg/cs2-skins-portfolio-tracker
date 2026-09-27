import "@fontsource-variable/nunito";
import "@fontsource/jetbrains-mono/400.css";
import "./globals.css";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { LiveUpdates } from "@/components/LiveUpdates";
import { Nav } from "@/components/Nav";
import { ApolloWrapper } from "@/lib/apollo/ApolloWrapper";

export const metadata: Metadata = {
  title: "CSFloat Watcher",
  description: "Saved CSFloat searches that tell you what's new.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eef0fb" },
    { media: "(prefers-color-scheme: dark)", color: "#1e1f2e" },
  ],
};

// Everything is live data from this server; never prerender at build time.
export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh antialiased">
        <ApolloWrapper>
          <Nav />
          <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-8 sm:px-6">{children}</main>
          <LiveUpdates />
        </ApolloWrapper>
      </body>
    </html>
  );
}
