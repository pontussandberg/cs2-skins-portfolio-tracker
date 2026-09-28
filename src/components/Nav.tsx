"use client";

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
    <header className="sticky top-0 z-30 border-b border-line bg-canvas/85 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-6 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid size-7 place-items-center rounded-md bg-accent text-xs font-bold text-accent-ink" aria-hidden>
            CF
          </span>
          <span className="hidden text-sm font-semibold sm:block">CSFloat Watcher</span>
        </Link>
        <nav className="flex h-full items-stretch gap-1">
          {LINKS.map((l) => {
            const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className="tab"
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <LinkButton href="/watches/new" tone="primary" size="sm" className="ml-auto">
          <span className="sm:hidden">+ New</span>
          <span className="hidden sm:inline">+ New watch</span>
        </LinkButton>
      </div>
    </header>
  );
}
