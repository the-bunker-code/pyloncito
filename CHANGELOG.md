# Changelog

Todas las fechas usan ISO 8601. El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).

## [No publicado]

### Agregado

- CSP en dos capas (meta de Astro + `_headers`) y pruebas E2E de violaciones.
- Precarga del dibujo de la ronda siguiente.
- Candado de 50 ms contra ráfagas de toques.
- Nombres accesibles por casilla (“Casilla N, vacía” / “Casilla N, unidad”).
- Cobertura ampliada a `src/games/**` con umbrales.
- Proyecto E2E `celular-horizontal-844x390`.
- Job `check-full` para PR a `main` con Lighthouse móvil.

### Cambiado

- La consigna de palabra ahora dice “Armemos la palabra gato.”.
- La voz prioriza `es-PE` → `es-419` → `es-*`, locales primero.
- “Repetir la consigna” mide 64 px de alto.
- Los ajustes de Mira y Dime se abren con un clic en el engranaje.
- La flecha de la barra de ronda vuelve al inicio del juego.
- `round_said` se eliminó; `said_count` queda agregado en `session_complete`.

### Corregido

- Lectura de `localStorage` rechaza `__proto__`, `constructor` y prototipos no planos.
- Los textos de consigna y resultado salieron de `rules.ts`.
- `/cookies/` ya no describe cookies de Hotjar inexistentes.
- `/privacidad/` explica el dato agregado de “Lo dijo” y lo que no se envía.

## [0.1.0] - 2026-10-28

- Base de Pyloncito con Astro 7, Vue 3.5, TypeScript 6 y Tailwind 4.
- Hub, layout, sistema visual, consentimiento y Mira y Dime en beta.
