import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";
import type { Database } from "../db/database.types";

// A request-scoped client acting as the viewer's (anonymous) Supabase session, so RLS decides
// what they can read. Reading cookies makes callers runtime data: render them inside <Suspense>.
export async function createSupabaseServerClient() {
  // supabase-js reads the clock while loading the session, which partial prefetching rejects.
  // Everything this client returns is per-viewer anyway, so render it at request time only.
  await connection();
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Called from a Server Component, where cookies are read-only. The proxy refreshes them.
          }
        },
      },
    },
  );
}
