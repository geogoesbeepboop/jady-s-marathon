import path from "node:path";
import { defineConfig } from "vitest/config";

try {
  process.loadEnvFile(".env.local");
} catch {
  // unit tests don't need it; the rls project fails loudly without it
}

export default defineConfig({
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
  test: {
    projects: [
      { extends: true, test: { name: "unit", include: ["tests/unit/**/*.test.ts"], environment: "node" } },
      {
        extends: true,
        // Talks to the local Supabase stack (pnpm db:start && pnpm db:env).
        test: { name: "rls", include: ["tests/rls/**/*.test.ts"], environment: "node", fileParallelism: false },
      },
    ],
  },
});
