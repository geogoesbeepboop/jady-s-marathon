"use client";

import { useActionState } from "react";
import { joinEvent, type JoinState } from "./join";

export function JoinButton({ token }: { token: string }) {
  const [state, action, pending] = useActionState<JoinState, FormData>(joinEvent.bind(null, token), {});

  return (
    <form action={action} className="flex flex-col gap-3">
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-ev-accent px-6 py-3.5 text-base font-semibold text-ev-accent-fg disabled:opacity-60"
      >
        {pending ? "Opening…" : "Open my weekend"}
      </button>
      {state.error && (
        <p role="alert" className="text-sm text-red-700">
          {state.error}
        </p>
      )}
    </form>
  );
}
