import { defineConfig } from "vitest/config";
// Tests run in Node with a real SQLite (node:sqlite) behind a D1-shaped mock and a Map-backed R2 mock: test/mock-env.js.
export default defineConfig({
  test: {
    include: ["test/**/*.test.js"],
    environment: "node",
    testTimeout: 30000,
  },
});
