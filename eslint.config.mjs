import { defineConfig, globalIgnores } from "eslint/config";
import next from "eslint-config-next";

/**
 * eslint-config-next 16 ships flat config natively, so it is imported directly.
 * This used to go through `FlatCompat` from @eslint/eslintrc — a bridge for
 * eslintrc-style configs. Once the config itself became flat, routing it back
 * through the bridge threw "Converting circular structure to JSON" before a
 * single file was linted.
 */
export default defineConfig([
  globalIgnores([
    "node_modules/**",
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    ".prisma/**",
    "src/generated/prisma/**",
  ]),
  ...next,
  {
    /**
     * The Next 16 preset drops `no-unused-vars` entirely, so nothing flagged
     * unused imports — which is how a dead `getCurrentUser` import survived in
     * `api/profile/route.ts` through a refactor that removed its last call.
     *
     * Warn rather than error so this doesn't block a build on a work-in-progress
     * variable. `args: "none"` because route handlers and React props routinely
     * accept parameters they don't read, and `_`-prefixed names stay exempt for
     * deliberate discards.
     */
    files: ["**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          args: "none",
          varsIgnorePattern: "^_",
          caughtErrors: "none",
          ignoreRestSiblings: true,
        },
      ],
    },
  },
]);
