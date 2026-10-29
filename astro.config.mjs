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
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        "base-uri 'self'",
        "form-action 'self'",
        "object-src 'none'",
        "frame-src 'none'",
        "font-src 'self'",
        "img-src 'self' data: https://www.google-analytics.com https://region1.google-analytics.com https://www.googletagmanager.com",
        "connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com https://www.googletagmanager.com",
      ],
      scriptDirective: {
        resources: ["'self'", 'https://www.googletagmanager.com', "'unsafe-inline'"],
      },
      styleDirective: {
        resources: [
          { resource: "'self'", kind: 'element' },
          { resource: "'unsafe-inline'", kind: 'attribute' },
        ],
      },
    },
  },
  vite: {
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
    },
    plugins: [tailwindcss()],
  },
});
