import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getJoinedEventSlugs } from "@/core/access/viewer";

// Also the home-screen start URL: a phone that has joined an event goes straight to it.
export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-2 px-6">
      <Suspense fallback={null}>
        <GoToJoinedEvent />
      </Suspense>
      <h1 className="text-2xl font-semibold">Open your personal link</h1>
      <p className="text-ev-muted">Each guest gets their own link to their plan for the weekend.</p>
    </main>
  );
}

async function GoToJoinedEvent() {
  const [latest] = await getJoinedEventSlugs();
  if (latest) redirect(`/${latest}`);
  return null;
}
