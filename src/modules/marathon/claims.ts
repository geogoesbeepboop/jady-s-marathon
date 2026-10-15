"use server";

import { refresh } from "next/cache";
import { createSupabaseServerClient } from "@/core/access/supabase-server";
import { getViewer } from "@/core/access/viewer";

export type ClaimState = { error?: string };

/** "I'll be here" / "Not anymore". RLS only lets a guest write claims as themselves. */
export async function setCheerClaim(eventSlug: string, placeId: string, claimed: boolean): Promise<ClaimState> {
  const viewer = await getViewer(eventSlug);
  if (!viewer) return { error: "Open your personal link first." };

  const supabase = await createSupabaseServerClient();
  const claims = supabase.from("marathon_cheer_claims");
  const { error } = claimed
    ? await claims.insert({ place_id: placeId, person_id: viewer.personId, event_id: viewer.event.id })
    : await claims.delete().match({ place_id: placeId, person_id: viewer.personId });

  // 23505: already claimed (a double tap), which is the state the guest wanted anyway.
  if (error && error.code !== "23505") return { error: "Couldn't save that. Check your signal and try again." };

  refresh();
  return {};
}
