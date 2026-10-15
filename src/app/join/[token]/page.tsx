import { Suspense } from "react";
import { JoinButton } from "@/core/access/join-button";
import { createSupabaseServerClient } from "@/core/access/supabase-server";
import { themeToCssVars } from "@/core/theme/theme";

export default function JoinPage({ params }: PageProps<"/join/[token]">) {
  return (
    <Suspense fallback={<p className="px-6 py-12 text-ev-muted">Checking your link…</p>}>
      <JoinCard params={params} />
    </Suspense>
  );
}

async function JoinCard({ params }: { params: PageProps<"/join/[token]">["params"] }) {
  const { token } = await params;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.rpc("preview_join_token", { p_token: token });
  const preview = data?.[0];

  if (!preview) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-2 px-6 py-12">
        <h1 className="text-2xl font-semibold">This link doesn&apos;t work</h1>
        <p className="text-ev-muted">It may have been replaced. Ask whoever sent it for a fresh one.</p>
      </main>
    );
  }

  return (
    <div style={themeToCssVars(preview.theme)} className="min-h-dvh bg-ev-bg font-ev text-ev-fg">
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-6 py-12">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium uppercase tracking-wide text-ev-muted">{preview.event_name}</p>
          <h1 className="text-3xl font-semibold">Hi {preview.display_name}</h1>
          <p className="text-ev-muted">
            This is your personal link. It opens your schedule on this phone. No account or password.
          </p>
        </div>
        <JoinButton token={token} />
      </main>
    </div>
  );
}
