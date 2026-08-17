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
]);
