// Keeps the last good copy of each event page on the phone, so the plan still opens when
// race-day cell service jams. Pages: network first, but a saved copy wins after a short wait,
// because a jammed network hangs rather than fails. Build assets: cache first (their URLs are
// content-hashed). Everything else, including other origins and POSTs, passes straight through.

const PAGES = "pages-v1";
const ASSETS = "assets-v1";
const NETWORK_WAIT_MS = 4000;

const OFFLINE_HTML = `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Offline</title><body style="font:16px/1.5 system-ui;padding:3rem 1.5rem;max-width:28rem;margin:auto">
<h1 style="font-size:1.5rem">No signal</h1><p>This page hasn't been saved on this phone yet.
Open it once while you have signal and it will work offline after that.</p>`;

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const name of await caches.keys()) {
        if (name !== PAGES && name !== ASSETS) await caches.delete(name);
      }
      await self.clients.claim();
    })(),
  );
});

function isEventPage(url) {
  return (
    url.origin === self.location.origin &&
    url.pathname !== "/" &&
    !url.pathname.startsWith("/join/") &&
    !url.pathname.startsWith("/_next/") &&
    !url.pathname.includes(".")
  );
}

async function savePage(url, response) {
  if (!response.ok || response.redirected) return;
  const html = response.clone();
  const cache = await caches.open(PAGES);
  await cache.put(new URL(url).pathname, response);
  await saveAssetsOf(await html.text());
}

// The scripts, styles and fonts a saved page references, so it still hydrates (tabs, the
// no-signal note) when opened offline instead of being frozen HTML.
async function saveAssetsOf(html) {
  const paths = new Set(html.match(/\/_next\/static\/[^"'\s)\\]+/g) ?? []);
  await Promise.all([...paths].map((path) => cacheFirst(new Request(path)).catch(() => {})));
}

async function savedPage(url) {
  const cache = await caches.open(PAGES);
  return cache.match(new URL(url).pathname, { ignoreVary: true });
}

async function networkThenSaved(event) {
  const network = fetch(event.request);
  // Saving (page plus its assets) runs in the background; the response never waits on it.
  event.waitUntil(network.then((response) => savePage(event.request.url, response.clone())).catch(() => {}));

  try {
    const first = await Promise.race([
      network,
      new Promise((resolve) => setTimeout(() => resolve("slow"), NETWORK_WAIT_MS)),
    ]);
    if (first !== "slow") return first;
    return (await savedPage(event.request.url)) ?? (await network);
  } catch {
    return (
      (await savedPage(event.request.url)) ??
      new Response(OFFLINE_HTML, { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } })
    );
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(ASSETS);
  const hit = await cache.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  if (response.ok) await cache.put(request, response.clone());
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  if (request.mode === "navigate" && isEventPage(url)) {
    event.respondWith(networkThenSaved(event));
  } else if (url.origin === self.location.origin && url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request));
  }
});

// The page asks us to save the person's other pages too, so a tab they never opened on signal
// still works offline. Replies { ok } on the given port.
self.addEventListener("message", (event) => {
  if (event.data?.type !== "save-pages") return;
  const [port] = event.ports;
  event.waitUntil(
    (async () => {
      let ok = true;
      for (const path of event.data.pages) {
        const url = new URL(path, self.location.origin);
        if (!isEventPage(url)) continue;
        try {
          const response = await fetch(url, { credentials: "same-origin" });
          if (!response.ok) ok = false;
          await savePage(url.href, response);
        } catch {
          ok = false;
        }
      }
      port?.postMessage({ ok });
    })(),
  );
});
