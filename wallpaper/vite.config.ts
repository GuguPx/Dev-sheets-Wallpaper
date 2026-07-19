import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));

/**
 * O build gera um único `index.html` autocontido (JS/CSS/dados inline). É o
 * formato ideal para importar como Web Wallpaper no CEF do Wallpaper Engine,
 * pois evita caminhos relativos e mantém tudo 100% offline (seções 26/28).
 *
 * `root` é fixado nesta pasta para que os scripts possam rodar a partir da raiz
 * do projeto (`vite --config wallpaper/vite.config.ts`).
 */
export default defineConfig({
  root: here,
  base: './',
  resolve: {
    alias: {
      '@': resolve(here, 'src'),
    },
  },
  plugins: [viteSingleFile()],
  build: {
    target: 'chrome100',
    outDir: resolve(here, '../dist'),
    emptyOutDir: true,
    cssCodeSplit: false,
    assetsInlineLimit: 100_000_000,
    chunkSizeWarningLimit: 5000,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
  server: {
    port: 5173,
    open: false,
  },
});
