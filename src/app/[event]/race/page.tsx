import { Suspense } from "react";
import { getViewer } from "@/core/access/viewer";
import { getPlaces } from "@/core/places/places";
import { getRace } from "@/modules/marathon/race";
import { RaceView } from "@/modules/marathon/race-view";

export default function RacePage({ params }: PageProps<"/[event]/race">) {
  return (
    <Suspense fallback={<p className="text-ev-muted">Loading race day…</p>}>
      <RaceDay params={params} />
    </Suspense>
  );
}

async function RaceDay({ params }: { params: PageProps<"/[event]/race">["params"] }) {
  const { event: slug } = await params;
  const viewer = await getViewer(slug);
  if (!viewer) return null; // the layout explains how to get in

  const [race, meetups] = await Promise.all([getRace(viewer.event.id), getPlaces(viewer.event.id, "meetup")]);
  if (!race) return <p className="text-ev-muted">No race is set up for this event.</p>;

  return <RaceView race={race} eventSlug={slug} viewer={viewer} meetups={meetups} timeZone={viewer.event.timezone} />;
}
