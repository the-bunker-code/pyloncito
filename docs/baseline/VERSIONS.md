# Fase 0 — versiones y compatibilidad

Fecha: 2026-10-28
Entorno: Node 24.18.0 · pnpm 12.15.0 · Astro 7.4.2

## Versiones consultadas

| Paquete | Versión |
|---|---|
| astro | 7.4.2 |
| vue | 3.5.44 |
| @astrojs/vue | 7.1.2 |
| tailwindcss | 4.3.3 |
| @tailwindcss/vite | 4.3.3 |
| typescript | 7.0.2 (latest) / 6.0.3 (compatible) |
| vitest | 5.0.5 |
| @vue/test-utils | 2.5.1 |
| @playwright/test | 1.64.1 |
| @axe-core/playwright | 4.14.0 |
| eslint | 10.13.0 |
| eslint-plugin-astro | 3.2.1 |
| eslint-plugin-vue | 10.12.0 |
| prettier | 3.9.10 |
| prettier-plugin-astro | 1.1.2 |
| prettier-plugin-tailwindcss | 0.8.1 |
| @vite-pwa/astro | 1.2.0 |
| @astrojs/check | 0.9.12 |
| vue-tsc | 3.3.13 |
| @astrojs/sitemap | 3.7.4 |
| tsx | 4.23.15 |
| typescript-eslint | 8.72.1 |
| vue-eslint-parser | 10.4.1 |

## Compatibilidad

- **Node:** Astro 7.4.2 exige `>=22.23.4`; Node 24.18.0 cumple.
- **pnpm:** Astro exige `>=7.1.0`; pnpm 12.15.0 cumple.
- **Astro + Vite:** Astro 7.4.2 usa Vite `^8.3.4`.
- **Tailwind:** `@tailwindcss/vite` 4.3.3 acepta Vite `^8`; compatible.
- **Vue:** `@astrojs/vue` 7.1.2 acepta Astro `^7.0.0` y Vue `^3.5.24`; compatible.
- **Vitest:** 5.0.5 acepta Vite `^8`; compatible.
- **TypeScript:** 7.0.2 es el `latest`, pero `@astrojs/check` 0.9.12 solo declara
  `^5.0.0 || ^6.0.0`. **Fijar TypeScript 6.0.3**, no 7.
- **ESLint:** ESLint 10.13.0 cumple el peer de `eslint-plugin-astro` y
  `eslint-plugin-vue`. Agregar `typescript-eslint` 8.72.1 y `vue-eslint-parser`
  10.4.1; los plugins de JSX de Astro son opcionales.
- **Prettier:** 3.9.10 cumple el peer de `prettier-plugin-tailwindcss`.
- **CSP:** `security.csp` es estable desde Astro 6. Configurar con hashes de Astro y
  complementar con `_headers`.
- **PWA:** `@vite-pwa/astro` 1.2.0 declara peer Astro `^1.6.0 … ^5.0.0`; **no declara
  compatibilidad con Astro 7**. No usarlo. Alternativa: `vite-plugin-pwa` 2.0.0
  (peer Vite `^8`) o un `sw.js` propio. Para Pyloncito conviene el SW propio, igual
  que en los cuatro juegos actuales.
- **Scripts TS:** Node 24 ejecuta `scripts/new-game.ts` con type stripping nativo;
  no hace falta `tsx` si el script usa sintaxis TS borrable (sin enums ni namespaces).

## Ajustes propuestos a ARQUITECTURA.md

1. Fijar TypeScript 6.0.3 y el resto de versiones de esta tabla.
2. Sustituir `@vite-pwa/astro` por un service worker propio en la Fase 6.
3. Confirmar `security.csp` estable y usar `_headers` para las directivas HTTP.
4. Mantener `tsx` fuera de las dependencias; `new-game.ts` corre con Node 24.

No se instaló nada en esta fase.
