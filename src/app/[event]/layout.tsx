import { Suspense } from "react";
import { getViewer } from "@/core/access/viewer";
import { OfflineStatus } from "@/core/offline/offline-status";
import { themeToCssVars } from "@/core/theme/theme";
import { hasRace } from "@/modules/marathon/race";
import { EventNav } from "./event-nav";

export default function EventLayout({ children, params }: LayoutProps<"/[event]">) {
  return (
    <Suspense fallback={<p className="px-5 py-10 text-ev-muted">Loading your weekend…</p>}>
      <EventShell params={params}>{children}</EventShell>
    </Suspense>
  );
}

async function EventShell({ params, children }: { params: LayoutProps<"/[event]">["params"]; children: React.ReactNode }) {
  const { event: slug } = await params;
  const viewer = await getViewer(slug);

  if (!viewer) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-2 px-6">
        <h1 className="text-2xl font-semibold">Open your personal link</h1>
        <p className="text-ev-muted">This page shows each person their own plan. Use the link you were sent.</p>
      </main>
    );
  }

  const tabs = [{ href: `/${slug}`, label: "Schedule" }];
  if (await hasRace(viewer.event.id)) tabs.push({ href: `/${slug}/race`, label: "Race day" });

  // Shown on every page so a saved copy opened offline is visibly dated.
  const renderedAt = new Intl.DateTimeFormat("en-US", {
    timeZone: viewer.event.timezone,
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date());

  return (
    <div style={themeToCssVars(viewer.event.theme)} className="min-h-dvh bg-ev-bg font-ev text-ev-fg">
      <main className="mx-auto flex w-full max-w-xl flex-col gap-6 px-5 pb-16 pt-10">
        <header className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-ev-muted">Hi {viewer.displayName}</p>
            <h1 className="text-3xl font-bold leading-tight">{viewer.event.name}</h1>
          </div>
          {tabs.length > 1 && <EventNav tabs={tabs} />}
        </header>
        {children}
        <footer className="flex flex-col gap-1 border-t border-ev-line pt-4 text-xs text-ev-muted">
          <p data-testid="rendered-at" data-at={new Date().toISOString()}>
            Updated {renderedAt}
          </p>
          <OfflineStatus pages={tabs.map((t) => t.href)} />
        </footer>
      </main>
    </div>
  );
}
