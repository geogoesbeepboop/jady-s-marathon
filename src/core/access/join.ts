"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "./supabase-server";

export type JoinState = { error?: string };

// Runs on an explicit tap rather than on page load, so link-preview bots that fetch the URL
// never create sessions or bind devices.
export async function joinEvent(token: string): Promise<JoinState> {
  const supabase = await createSupabaseServerClient();

  // getUser, not getClaims: the cookie can hold a still-valid JWT for a user that no longer
  // exists (anonymous-user cleanup, a reset database). Only the auth server can tell, and
  // joining is rare enough to afford the round trip.
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    const { error } = await supabase.auth.signInAnonymously();
    if (error) return { error: "Couldn't start a session. Try again in a minute." };
  }

  const { data: slug, error } = await supabase.rpc("redeem_join_token", { p_token: token });
  if (error?.code === "P0002") return { error: "This link doesn't work anymore. Ask for a fresh one." };
  if (error || !slug) return { error: "Something went wrong opening your link. Try again." };

  redirect(`/${slug}`);
}
