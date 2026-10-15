// MapLibre 6 loads its worker from a separate file that Turbopack doesn't emit, so serve the
// package's own copy from public/ (runs on every install, so it always matches the package).
import { copyFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const dist = path.dirname(require.resolve("maplibre-gl/package.json"));
mkdirSync("public/vendor", { recursive: true });
copyFileSync(path.join(dist, "dist/maplibre-gl-worker.mjs"), "public/vendor/maplibre-gl-worker.mjs");
