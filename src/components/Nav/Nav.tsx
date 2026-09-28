"use client";

import { usePathname } from "next/navigation";
import { TabLink } from "@/components/ui";
import { Bar, Brand, Inner, Links, Logo, LongLabel, Name, NewWatchButton, ShortLabel } from "./Nav.styles";

const LINKS = [
  { href: "/", label: "Feed" },
  { href: "/watches", label: "Watches" },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <Bar>
      <Inner>
        <Brand href="/">
          <Logo aria-hidden>CF</Logo>
          <Name>CSFloat Watcher</Name>
        </Brand>
        <Links>
          {LINKS.map((l) => {
            const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <TabLink key={l.href} href={l.href} aria-current={active ? "page" : undefined}>
                {l.label}
              </TabLink>
            );
          })}
        </Links>
        <NewWatchButton href="/watches/new" tone="primary" size="sm">
          <ShortLabel>+ New</ShortLabel>
          <LongLabel>+ New watch</LongLabel>
        </NewWatchButton>
      </Inner>
    </Bar>
  );
}
