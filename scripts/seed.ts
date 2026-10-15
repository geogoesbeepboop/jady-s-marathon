// pnpm seed <event-slug> [--rotate key,key | --rotate-all]
//
// Applies events/<slug>/event.ts to the Supabase project in .env.local and writes any newly issued
// join links to .links/<slug>--<db host>.csv (gitignored). Tokens are stored hashed, so that file
// is the only copy of a link: keep it, or rotate to issue fresh ones.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/core/db/database.types";
import { seedEventWithModules } from "@/seed";
import type { EventSeedInput } from "@/core/seed/schema";

function env(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set (run pnpm db:env for local, or fill .env.local)`);
  return value;
}

async function main() {
  const [slug, ...flags] = process.argv.slice(2);
  if (!slug) throw new Error("usage: pnpm seed <event-slug> [--rotate key,key | --rotate-all]");

  const { default: seed } = (await import(path.resolve("events", slug, "event.ts"))) as {
    default: EventSeedInput;
  };

  const rotateFlag = flags.indexOf("--rotate");
  const rotate = flags.includes("--rotate-all")
    ? seed.people.map((p) => p.key)
    : rotateFlag >= 0
      ? (flags[rotateFlag + 1] ?? "").split(",").filter(Boolean)
      : [];

  const supabaseUrl = env("NEXT_PUBLIC_SUPABASE_URL");
  const db = createClient<Database>(supabaseUrl, env("SUPABASE_SECRET_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const appUrl = env("APP_URL").replace(/\/$/, "");

  const { issued } = await seedEventWithModules(db, seed, { rotate });

  const file = path.join(".links", `${slug}--${new URL(supabaseUrl).hostname}.csv`);
  const rows = new Map<string, string>();
  try {
    for (const line of (await readFile(file, "utf8")).split("\n").slice(1).filter(Boolean)) {
      rows.set(line.split(",")[0], line);
    }
  } catch {
    // first run for this database
  }
  for (const link of issued) {
    rows.set(link.personKey, [link.personKey, JSON.stringify(link.displayName), `${appUrl}/join/${link.token}`].join(","));
  }
  for (const key of rows.keys()) {
    if (!seed.people.some((p) => p.key === key)) rows.delete(key);
  }

  await mkdir(".links", { recursive: true });
  await writeFile(file, ["person,name,link", ...rows.values()].join("\n") + "\n");

  console.log(`Seeded ${slug}: ${seed.people.length} people, ${seed.agenda?.length ?? 0} agenda items.`);
  console.log(issued.length ? `Issued ${issued.length} new link(s) → ${file}` : `No new links; existing ones are in ${file}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
