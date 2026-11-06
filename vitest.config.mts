import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// Minimal unit-test setup. The app had no test runner at all, so the
// security fixes in src/lib/csv.ts and src/components/html-content.tsx had
// nowhere to put a regression test. Scope is deliberately narrow: pure
// helpers plus server-rendered component output, no browser environment
// and no component-interaction library.
export default defineConfig({
  resolve: {
    alias: {
      // fileURLToPath, not URL.pathname: pathname keeps "%20" for spaces and
      // a leading "/D:" on Windows, so "@/..." never resolved there.
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
