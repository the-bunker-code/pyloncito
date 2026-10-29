import { readFileSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import vue from '@astrojs/vue';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

export default defineConfig({
  site: 'https://pyloncito.app',
  output: 'static',
  integrations: [vue(), sitemap()],
  vite: {
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
    },
    plugins: [tailwindcss()],
  },
});
