"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LinkButton } from "./ui";

const LINKS = [
  { href: "/", label: "Feed" },
  { href: "/watches", label: "Watches" },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 pt-6 sm:px-6">
      <Link href="/" className="flex items-center gap-3">
        <span className="clay-sm grid size-11 place-items-center rounded-2xl bg-accent text-lg font-black text-accent-ink" aria-hidden>
          CF
        </span>
        <span className="hidden text-lg font-black tracking-tight sm:block">CSFloat Watcher</span>
      </Link>
      <nav className="clay flex items-center gap-1 rounded-full p-1.5">
        {LINKS.map((l) => {
          const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              aria-current={active ? "page" : undefined}
              className={clsx("rounded-full px-4 py-2 text-sm font-bold transition", active ? "clay-sm bg-accent text-accent-ink" : "text-ink-muted hover:text-ink")}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>
      <LinkButton href="/watches/new" tone="mint" size="sm">
        <span className="sm:hidden">+ New</span>
        <span className="hidden sm:inline">+ New watch</span>
      </LinkButton>
    </header>
  );
}
