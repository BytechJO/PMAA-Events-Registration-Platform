import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // The integration tests share TEST_DATABASE_URL and each runs the migrations first: one file at a time,
    // so two workers never migrate or truncate the same database at once.
    fileParallelism: false,
  },
});
