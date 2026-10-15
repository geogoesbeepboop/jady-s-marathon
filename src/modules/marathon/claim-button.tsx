"use client";

import { useActionState } from "react";
import { setCheerClaim, type ClaimState } from "./claims";

export function ClaimButton({ eventSlug, placeId, claimed }: { eventSlug: string; placeId: string; claimed: boolean }) {
  const [state, action, pending] = useActionState<ClaimState, FormData>(
    setCheerClaim.bind(null, eventSlug, placeId, !claimed),
    {},
  );

  return (
    <form action={action} className="flex flex-col items-start gap-1">
      <button
        type="submit"
        disabled={pending}
        className={
          claimed
            ? "rounded-full border border-ev-accent px-4 py-2 text-sm font-semibold text-ev-accent disabled:opacity-60"
            : "rounded-full bg-ev-accent px-4 py-2 text-sm font-semibold text-ev-accent-fg disabled:opacity-60"
        }
      >
        {pending ? "Saving…" : claimed ? "You're here · undo" : "I'll be here"}
      </button>
      {state.error && (
        <p role="alert" className="text-xs text-red-700">
          {state.error}
        </p>
      )}
    </form>
  );
}
