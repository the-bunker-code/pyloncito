# Fase 0 — cierre

## Hecho

- Baseline por commit y remoto en `MANIFEST.txt`; sin bundles locales.
- 24 capturas: 4 juegos × 2 viewports × inicio/ronda/final.
- `capturas/console.txt` vacío: sin errores ni warnings de consola.
- Versiones y compatibilidad en `VERSIONS.md`.

## Decisiones de la fase

- Astro 7.4.2, Vue 3.5.44, TypeScript 6.0.3, Tailwind 4.3.3.
- TypeScript 7.0.2 no se usa porque `@astrojs/check` solo declara `^5 || ^6`.
- `@vite-pwa/astro` 1.2.0 no declara Astro 7; la PWA se hará con `sw.js` propio.
- Sesiones de 3 a 15 minutos; cada juego conserva su duración actual.
- Toque infantil de 64 px en Pyloncito; 44 px para adultos.
- `scripts/new-game.ts` corre con type stripping de Node 24; no hace falta `tsx`.
- CSP con `security.csp` de Astro + `_headers`.

## Pendiente

- Codificar la aplicación: empieza en la Fase 1.
- Verificar en la Fase 1 que `astro check` y `vue-tsc` funcionen con TypeScript 6.
- Revisar la experiencia de las capturas contra los juegos migrados.

## Cómo probar

1. Abrir `capturas/<juego>/<viewport>/`.
2. Comparar inicio, ronda y final con el juego original.
3. Revisar `console.txt` y `VERSIONS.md`.
