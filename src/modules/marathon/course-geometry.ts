// Flat projection of a city-sized course onto an SVG box. At this scale an equirectangular
// projection scaled by cos(latitude) is indistinguishable from Web Mercator.

export type LngLat = [number, number];

export type Projection = {
  width: number;
  height: number;
  project: (point: LngLat) => { x: number; y: number };
};

export function fitProjection(points: LngLat[], width = 340, maxHeight = 420, pad = 18): Projection {
  const lngs = points.map((p) => p[0]);
  const lats = points.map((p) => p[1]);
  const [minLng, maxLng, minLat, maxLat] = [Math.min(...lngs), Math.max(...lngs), Math.min(...lats), Math.max(...lats)];
  const kx = Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180);
  const spanX = Math.max((maxLng - minLng) * kx, 1e-9);
  const spanY = Math.max(maxLat - minLat, 1e-9);

  const scale = Math.min((width - 2 * pad) / spanX, (maxHeight - 2 * pad) / spanY);
  const height = Math.round(spanY * scale + 2 * pad);
  const offsetX = (width - spanX * scale) / 2;

  return {
    width,
    height,
    project: ([lng, lat]) => ({ x: offsetX + (lng - minLng) * kx * scale, y: pad + (maxLat - lat) * scale }),
  };
}

/** Keeps the first and last point and every n-th one in between, so the SVG stays small. */
export function thin<T>(points: T[], max = 600): T[] {
  if (points.length <= max) return points;
  const step = Math.ceil(points.length / max);
  return points.filter((_, i) => i % step === 0 || i === points.length - 1);
}

export function svgPath(points: { x: number; y: number }[]) {
  return points.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join("");
}
