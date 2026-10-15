import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // The event core must stay reusable across event types: modules and event data depend on
    // core, never the reverse.
    files: ["src/core/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["@/modules/**", "**/modules/**"], message: "core must not import event-type modules." },
            { group: ["**/events/**"], message: "core must not import event data; pass it in." },
            { group: ["@/app/**"], message: "core must not import app routes." },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "src/core/db/database.types.ts",
    "playwright-report/**",
    "test-results/**",
    "public/vendor/**",
  ]),
]);

export default eslintConfig;
