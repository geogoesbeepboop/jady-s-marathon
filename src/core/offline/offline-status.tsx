"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

function subscribe(onChange: () => void) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

// Registers the service worker (production only, so dev never serves stale chunks) and asks it
// to save this person's pages. Says so in one line, and says when you're looking at a saved copy.
export function OfflineStatus({ pages }: { pages: string[] }) {
  const online = useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
  const [saved, setSaved] = useState(false);
  const pageList = pages.join("|");

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator) || !navigator.onLine) return;
    let cancelled = false;

    navigator.serviceWorker
      .register("/sw.js")
      .then(() => navigator.serviceWorker.ready)
      .then((registration) => {
        const channel = new MessageChannel();
        channel.port1.onmessage = (event: MessageEvent<{ ok: boolean }>) => {
          if (cancelled || !event.data.ok) return;
          setSaved(true);
          document.documentElement.dataset.offlineReady = "true";
        };
        registration.active?.postMessage({ type: "save-pages", pages: pageList.split("|") }, [channel.port2]);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [pageList]);

  if (!online) return <p className="font-medium text-ev-fg">No signal: showing the copy saved on this phone.</p>;
  if (saved) return <p>Saved on this phone for when there&apos;s no signal.</p>;
  return null;
}
