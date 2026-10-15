"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function EventNav({ tabs }: { tabs: { href: string; label: string }[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 rounded-full border border-ev-line bg-ev-card p-1">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={
              active
                ? "flex-1 rounded-full bg-ev-accent px-4 py-2 text-center text-sm font-semibold text-ev-accent-fg"
                : "flex-1 rounded-full px-4 py-2 text-center text-sm font-medium text-ev-muted"
            }
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
