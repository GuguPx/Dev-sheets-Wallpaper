import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(here, 'wallpaper/src'),
    },
  },
  test: {
    environment: 'jsdom',
    // Origem não-opaca para habilitar localStorage/sessionStorage completos no jsdom.
    environmentOptions: { jsdom: { url: 'http://localhost/' } },
    globals: true,
    include: ['tests/**/*.test.ts'],
    setupFiles: ['tests/setup.ts'],
  },
});
