import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/**
 * Node environment only — nothing here renders components. The slice this covers
 * is the logic that was changed recently and verified by hand: upload sniffing,
 * the role gate's 401-vs-403 split, and event status derivation (CLEANUP.md
 * §13.1). Component and DOM testing would need jsdom and can be added when
 * there is something worth rendering.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
