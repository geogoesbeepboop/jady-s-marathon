import { Suspense } from "react";
import { getViewer } from "@/core/access/viewer";
import { getVisibleAgenda } from "@/core/schedule/agenda";
import { ScheduleView } from "@/core/schedule/schedule-view";

export default function SchedulePage({ params }: PageProps<"/[event]">) {
  return (
    <Suspense fallback={<p className="text-ev-muted">Loading the schedule…</p>}>
      <Schedule params={params} />
    </Suspense>
  );
}

async function Schedule({ params }: { params: PageProps<"/[event]">["params"] }) {
  const { event: slug } = await params;
  const viewer = await getViewer(slug);
  if (!viewer) return null; // the layout explains how to get in

  const agenda = await getVisibleAgenda(viewer.event.id);
  return <ScheduleView agenda={agenda} timeZone={viewer.event.timezone} />;
}
