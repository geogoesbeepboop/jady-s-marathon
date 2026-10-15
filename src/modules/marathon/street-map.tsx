"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";
import type { LngLat } from "./course-geometry";

const STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";
const WORKER_URL = "/vendor/maplibre-gl-worker.mjs"; // see scripts/copy-map-worker.mjs

// Street context for planning moves between spots. Loads only on tap: it needs signal, and the
// map library is heavy. The SVG course drawing is the offline fallback.
export function StreetMap({ course, spots }: { course: LngLat[]; spots: { lng: number; lat: number; label: string }[] }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !container.current) return;
    const element = container.current;
    let map: import("maplibre-gl").Map | undefined;
    let cancelled = false;
    const giveUp = setTimeout(() => setStatus((s) => (s === "loading" ? "failed" : s)), 10_000);

    import("maplibre-gl")
      .then((maplibregl) => {
        if (cancelled) return;
        maplibregl.setWorkerUrl(WORKER_URL);
        const accent = getComputedStyle(element).getPropertyValue("--ev-accent").trim() || "#ff5a1f";
        const lngs = course.map((c) => c[0]);
        const lats = course.map((c) => c[1]);

        const instance = new maplibregl.Map({
          container: element,
          style: STYLE_URL,
          bounds: [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)],
          fitBoundsOptions: { padding: 24 },
          attributionControl: { compact: true },
        });
        map = instance;
        instance.on("load", () => {
          instance.addSource("course", {
            type: "geojson",
            data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: course } },
          });
          instance.addLayer({
            id: "course",
            type: "line",
            source: "course",
            layout: { "line-cap": "round", "line-join": "round" },
            paint: { "line-color": accent, "line-width": 4, "line-opacity": 0.85 },
          });
          spots.forEach((spot) => {
            const marker = document.createElement("div");
            marker.textContent = spot.label;
            marker.style.cssText = `width:22px;height:22px;border-radius:50%;background:${accent};color:#fff;font:700 11px/22px system-ui;text-align:center;border:2px solid #fff`;
            new maplibregl.Marker({ element: marker }).setLngLat([spot.lng, spot.lat]).addTo(instance);
          });
          setStatus("ready");
        });
      })
      .catch(() => setStatus("failed"));

    return () => {
      cancelled = true;
      clearTimeout(giveUp);
      map?.remove();
    };
  }, [open, course, spots]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="self-start rounded-full border border-ev-line bg-ev-card px-4 py-2 text-sm font-medium"
      >
        Show street map
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div ref={container} className="h-80 w-full overflow-hidden rounded-2xl border border-ev-line bg-ev-card" />
      {status === "failed" && (
        <p className="text-xs text-ev-muted">The street map needs signal. The course drawing above works offline.</p>
      )}
    </div>
  );
}
