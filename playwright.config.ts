import { defineConfig, devices } from "@playwright/test";

try {
  process.loadEnvFile(".env.local");
} catch {
  // global setup fails loudly without it
}

// Needs the local Supabase stack (pnpm db:start && pnpm db:env). Runs a production build, because
// the offline service worker only registers in production. Real iPhone Safari is checked by hand
// on a Vercel preview; this runs a phone-sized Chromium.
const PORT = 3200;

export default defineConfig({
  testDir: "tests/e2e",
  workers: 1, // the specs share Rae and Sam's sessions, and one deletes a session on purpose
  globalSetup: "./tests/e2e/global-setup.ts",
  use: { ...devices["Pixel 7"], baseURL: `http://localhost:${PORT}` },
  webServer: {
    command: `pnpm build && pnpm exec next start --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 240_000,
  },
});
