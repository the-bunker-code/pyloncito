# Pyloncito — arquitectura

> Documento de arquitectura y plan por fases. Aprobado el 2026-10-28, revisión 3.
> **No se escribe código de la migración hasta cerrar la fase 0.**

Pyloncito es el sistema de juegos para aprender jugando. El hub reúne los cuatro
juegos de la serie y la base compartida permite sumar juegos nuevos sin reescribir
la plataforma.

## 1. Objetivo

Un solo sitio público, estático y sin backend, con los juegos de la serie, preparado
para sumar juegos nuevos con poco esfuerzo. El sitio y el sistema se llaman
**Pyloncito**.

| Slug          | Juego           | Origen                        |
| ------------- | --------------- | ----------------------------- |
| `dados`       | Dados y Tapitas | `code/matematicas-con-dados/` |
| `memoria`     | Memo Colores    | `code/memo-colores/`          |
| `miradas`     | Miradas         | `code/miradas/`               |
| `mira-y-dime` | Mira y Dime     | `code/mira-y-dime/`           |

Un dominio, un deploy, un hub. Los cuatro juegos conservan su comportamiento; se
reescriben sobre una base común Astro + Vue.

**Criterio de éxito de la arquitectura:** agregar un juego nuevo (estructura, registro,
página y tests base) debe tomar una sola sesión de trabajo nocturna.

## 2. Decisiones cerradas

| Tema               | Decisión                                                                               |
| ------------------ | -------------------------------------------------------------------------------------- |
| Alcance            | Pyloncito: sitio único con hub + 4 juegos + receta para juegos nuevos                  |
| Frontend           | Astro 7.4.2 · Vue 3.5.44 · TypeScript 6.0.3 · Tailwind 4.3.3                           |
| Runtime            | Node 24.18.0 (mínimo de Astro: >=22.23.4)                                              |
| Gestor de paquetes | **pnpm 12.15.0**, fijado con `packageManager` en `package.json`                        |
| Testing            | Vitest 5.0.5 · Playwright 1.64.1 · axe-core 4.14.0                                     |
| Calidad            | ESLint 10.13.0 · Prettier 3.9.10 · `astro check` 0.9.12 · `vue-tsc` 3.3.13             |
| Estilos            | Tailwind para layout/hub; CSS semántico para piezas custom. **Sin SCSS**               |
| 4K                 | Monitor de cerca: ancho máximo + `3xl: 2560px`; sin UI de 10 pies                      |
| Público            | Sí; sin cuentas, perfiles, cookies ni analytics                                        |
| Progreso           | `localStorage`, validado y con claves por juego                                        |
| Voz                | Web Speech; voz local primero; preferencia `es-419` → `es-PE` → `es-*`; silenciable    |
| IA                 | Fuera de fase 1. Sin Worker, sin OpenRouter, sin fotos                                 |
| Deploy             | Cloudflare Workers (static assets) conectado a Git; producción en `pyloncito.app`      |
| Idioma             | Solo español; textos centralizados                                                     |
| Nombre             | **Pyloncito**. Dominio: `pyloncito.app` (apex canónico; `www` redirige)                |
| Repo               | `code/pyloncito/` → `the-bunker-code/pyloncito`; los 4 actuales quedan como referencia |
| GitHub             | Project “Pyloncito” como tablero de ejecución; issues en español                       |

## 3. Estructura

```text
code/pyloncito/
├── astro.config.mjs
├── wrangler.jsonc
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── ARQUITECTURA.md
├── README.md                    # incluye "Cómo agregar un juego"
├── LICENSE
├── SECURITY.md
├── CONTRIBUTING.md
├── .github/
│   ├── ISSUE_TEMPLATE/{epic,task,bug,decision}.yml
│   └── PULL_REQUEST_TEMPLATE.md
├── docs/
│   ├── GITHUB.md                # Project, campos, labels y flujo
│   └── baseline/                # capturas, versiones y reporte de Fase 0
├── public/
│   ├── _headers
│   ├── fonts/fredoka-latin-v17.woff2
│   ├── icons/                   # un ícono fijo por juego + íconos PWA
│   ├── objects/                 # 184 SVG de Mira y Dime + LICENSE
│   └── robots.txt
├── src/
│   ├── config/
│   │   ├── site.ts
│   │   └── games.ts             # registro único de juegos
│   ├── layouts/BaseLayout.astro
│   ├── pages/
│   │   ├── index.astro          # hub, generado desde games.ts
│   │   ├── guia.astro
│   │   ├── privacidad.astro
│   │   ├── creditos.astro
│   │   ├── 404.astro
│   │   ├── manifest.webmanifest.ts   # generado desde games.ts
│   │   └── juegos/
│   │       ├── dados.astro
│   │       ├── memoria.astro
│   │       ├── miradas.astro
│   │       └── mira-y-dime.astro
│   ├── components/
│   │   ├── hub/GameCard.astro
│   │   ├── layout/{SiteHeader,SiteFooter}.astro
│   │   ├── ui/
│   │   │   ├── AppButton.vue
│   │   │   ├── AppDialog.vue
│   │   │   ├── AdultGate.vue
│   │   │   ├── Cap.vue
│   │   │   ├── ClosingNotice.vue      # aviso de cierre de sesión
│   │   │   ├── GameHeader.vue         # ícono + color fijos del juego
│   │   │   ├── Icon.vue
│   │   │   ├── Mascot.vue
│   │   │   ├── ProgressBar.vue
│   │   │   ├── SettingsDialog.vue
│   │   │   ├── SoundToggle.vue
│   │   │   └── VoiceTest.vue
│   │   └── games/
│   │       ├── dados/Game.vue
│   │       ├── memoria/Game.vue
│   │       ├── miradas/Game.vue
│   │       └── mira-y-dime/Game.vue
│   ├── games/
│   │   ├── shared/{timers,focus,session}.ts
│   │   ├── dados/{rules,engine,config,copy,storage}.ts
│   │   ├── memoria/{rules,engine,config,copy,storage}.ts
│   │   ├── miradas/{rules,engine,config,copy,storage}.ts
│   │   └── mira-y-dime/{rules,engine,config,copy,storage}.ts
│   ├── lib/
│   │   ├── audio.ts
│   │   ├── random.ts
│   │   ├── speech.ts
│   │   └── storage.ts
│   ├── content/es/
│   │   ├── common.ts
│   │   ├── dados.ts
│   │   ├── memoria.ts
│   │   ├── miradas.ts
│   │   └── mira-y-dime.ts
│   └── styles/
│       ├── global.css           # @import "tailwindcss" + @theme
│       └── components.css       # botón grueso, tapita, mascota, tarjetas
├── tests/
│   ├── unit/
│   └── e2e/
├── scripts/
│   └── new-game.ts              # crea la estructura de un juego nuevo
└── .github/workflows/ci.yml
```

## 4. Registro de juegos

`src/config/games.ts` es la única fuente de verdad sobre qué juegos existen.

```ts
export interface GameEntry {
  slug: string; // kebab-case, estable para siempre
  name: string; // nombre visible
  icon: IconName; // nombre del mapa de íconos del proyecto
  theme: 'dados' | 'memoria' | 'miradas' | 'mira-y-dime';
  age: string; // "3–6 años"
  skill: string; // "Contar y sumar"
  minutes: readonly [number, number]; // duración sugerida, dentro de 3–15
  status: 'ready' | 'beta' | 'coming' | 'hidden';
  description: string; // una frase para el hub y la guía
}
```

`coming` muestra la tarjeta como “Próximamente”; `hidden` no aparece en el hub.
El tema se resuelve con la clase `game-card--<theme>`; no se usan estilos inline.

Desde el registro se generan: tarjetas del hub, sitemap, manifiesto, accesos directos
de la PWA y el índice de la guía. Ninguna otra parte del código repite la lista de
juegos.

### Cómo agregar un juego

1. `pnpm new-game <slug>` crea:
   - `src/games/<slug>/{rules,engine,config,copy,storage}.ts`
   - `src/components/games/<slug>/Game.vue`
   - `src/pages/juegos/<slug>.astro`
   - `src/content/es/<slug>.ts`
   - `tests/unit/<slug>.rules.test.ts` y `tests/e2e/<slug>.smoke.spec.ts`
   - entrada en `games.ts` con `status: 'hidden'`
2. Diseñar el ícono y el color del juego. Una vez publicado, no se cambian.
3. Escribir reglas y tests primero; luego motor; luego vista.
4. Cambiar a `beta` para probar en el preview; a `ready` cuando quede estable.

## 5. Arquitectura de la app

- Astro `output: 'static'`. Sin adapter, sin Functions, sin SSR.
- Vue solo en islas interactivas (`client:load`). El hub no envía JS de juego.
- Cada juego tiene:
  - `rules.ts`: reglas puras, azar inyectable.
  - `engine.ts`: estado, fases, esperas cancelables.
  - `config.ts`: datos fijos.
  - `copy.ts`: textos, importados desde `content/es`.
  - `storage.ts`: ajustes/progreso validados.
  - `Game.vue`: dibuja desde el estado y emite acciones.
- Flujo único: `acción → engine → estado → render`.
- Un solo cambio de estado por acción; candado de fase para ignorar toques en ráfaga.
- Temporizadores con `roundId`/generación; al salir o reiniciar se descartan.
- `localStorage` con namespace `juegos:<slug>:<clave>:v1`. Si falla, el juego sigue
  sin guardar.
- Textos fuera de la lógica. Nada de frases en `rules.ts` ni `engine.ts`.
- Audio: voz local primero; si solo hay voces de red, se usan solo con voz activada y
  se avisa en privacidad. Tonos con Web Audio, sin archivos.
- CSP con `security.csp` de Astro (estable desde Astro 6; hashes de scripts y estilos)
  - directivas HTTP en `_headers`.
- PWA: un manifiesto y un `sw.js` propio para todo el sitio. HTML network-first;
  assets con hash cache-first. `@vite-pwa/astro` 1.2.0 no declara compatibilidad con
  Astro 7, así que no se usa; se reutiliza el patrón de los cuatro juegos actuales.
- Sin `innerHTML` con datos de usuario. Vue escapa por defecto.

## 6. Requisitos de uso infantil

Aplican a todos los juegos, actuales y futuros. Se implementan en componentes
compartidos para que ningún juego tenga que resolverlos por su cuenta.

| Requisito       | Implementación                                                                                                                                             |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ancla visual    | Cada juego tiene un ícono y un color fijos, idénticos en hub, `GameHeader`, PWA y guía. No cambian entre versiones                                         |
| Aviso de cierre | `ClosingNotice` anuncia el final antes de que llegue ("dos rondas más", "una más", "terminamos"), con voz y visual. Nunca se corta de golpe                |
| Duración        | Sesiones configurables de 3 a 15 minutos. `session.ts` controla rondas y tiempo; cada juego conserva su duración actual (Memo 3/5/8 rondas, Miradas 5 min) |
| Gate de adultos | Pulsación sostenida de 3 s sobre un botón, con barra de progreso. No usar sumas: los juegos enseñan a sumar                                                |
| Carga sensorial | Sin destellos, sin sonidos fuertes, animaciones de premio cortas; `prefers-reduced-motion` obligatorio                                                     |
| Toque           | Objetivos de al menos 64 px en móvil; sin gestos complejos (arrastrar solo donde el juego lo requiera)                                                     |
| Voz             | `VoiceTest` en ajustes permite escuchar y elegir la voz                                                                                                    |

## 7. Diseño, Tailwind y 4K

- Tailwind 4 con `@tailwindcss/vite`; no `@astrojs/tailwind` (deprecado).
- Tokens del brandbook en `@theme`: colores, radios, sombras, tipografías,
  `--breakpoint-3xl: 2560px`.
- Breakpoints:

  | Token | Ancho  |
  | ----- | ------ |
  | `xs`  | 0      |
  | `sm`  | 576px  |
  | `md`  | 768px  |
  | `lg`  | 1024px |
  | `xl`  | 1280px |
  | `2xl` | 1536px |
  | `3xl` | 2560px |

- Tailwind para grid, spacing, tipografía y responsive del hub.
- CSS semántico para `.button`, `.cap`, `.mascot`, tarjetas, tableros y animaciones.
- Superficies temáticas con variables CSS (`--theme-main`, `--theme-dark`, etc.).
- Sin hex fuera de tokens. Sin `!important`. Sin `style=""`.
- 4K de cerca: contenido centrado con `max-width` de 1440–1600 px; `3xl` solo ajusta
  escala y anchos; tamaños con `clamp()`.
- Mobile-first; sin scroll horizontal; safe-area insets.

## 8. Contenido público

- `/`: hub con las tarjetas del registro (ícono, nombre, edad, habilidad, duración).
- `/juegos/<slug>/`: juego.
- `/guia/`: cómo acompañar, qué entrena cada juego, sugerencias.
- `/privacidad/`: qué se guarda, qué no, voz, localStorage, sin cuentas.
- `/creditos/`: Fredoka OFL, Lucide ISC, Fluent Emoji MIT.
- Sin analytics, sin cookies, sin publicidad, sin login.
- SEO: canonical, OG, sitemap, robots. `site` configurable en `src/config/site.ts`.

## 9. Testing y calidad

Dos niveles para no frenar el avance.

### Nivel A — bloqueante en cada fase (`pnpm check`)

- `astro check` + `vue-tsc --noEmit`.
- ESLint 9 + `eslint-plugin-astro` + `eslint-plugin-vue`; Prettier + plugins Astro y
  Tailwind.
- Vitest: reglas y motores de cada juego portado, `lib/` y `games/shared/`.
- Build estático.
- Playwright smoke: hub + cada juego portado, en 390×844 y 1366×900, sin errores de
  consola.

### Nivel B — bloqueante solo en fase 6 (`pnpm check:full`)

- Cobertura ≥ 90 % en lógica pura.
- Playwright completo + axe-core: ajustes, gate, cierre de sesión, teclado, reduced
  motion, offline, toques en ráfaga, violaciones CSP.
- Viewports: 390×844, 844×390, 1366×900, 2560×1440, 3840×2160.
- Capturas de inicio, ronda y final comparadas con los juegos originales.
- Lighthouse CI móvil y escritorio.

CI en GitHub Actions con Node 24 y pnpm. El nivel A corre en cada push; el nivel B,
manual o en PR a `main`.

## 10. Fases

### Fase 0 — Snapshot y verificación

- Revisar estado de los 4 repos.
- `miradas` no tiene commits; `memo-colores` y `matematicas-con-dados` tienen cambios
  sin commitear. Crear baseline (bundle o copia) antes de tocar. No borrar ni mover.
- Guardar capturas actuales a 390×844 y 1366×900.
- Verificar con `pnpm view <paquete> version`: astro, vue, @astrojs/vue, tailwindcss,
  @tailwindcss/vite, vitest, @playwright/test, @vite-pwa/astro.
- Confirmar estado del soporte CSP en Astro y compatibilidad de `@vite-pwa/astro`.
- Entregar tabla de versiones y hallazgos. **Esperar aprobación.**

### Fase 1 — Base + hub + shared + deploy

- Crear `code/pyloncito/` con Astro, Vue, Tailwind, TS, Vitest, Playwright, ESLint,
  Prettier, pnpm.
- `games.ts` con los 4 juegos en `status: 'coming'` (tarjetas “Próximamente”).
- Layout, tokens, componentes UI (incluye `GameHeader`, `ClosingNotice`, `AdultGate`,
  `VoiceTest`), hub, guía, privacidad, créditos, 404.
- `audio`, `speech`, `random`, `storage`, `timers`, `focus`, `session`.
- `scripts/new-game.ts` y sección "Cómo agregar un juego" en el README.
- Conectar Workers `pyloncito`; configurar preview de `develop` y verificar `dev.pyloncito.app`.
- `pnpm check` verde.

### Fase 2 — Memo Colores

- Portar reglas, motor, config, copy y storage.
- 3 modos × 3 niveles; sesiones 3/5/8; ajustes; progreso.
- Usar `new-game` como punto de partida para validar el script.
- Tests nivel A. Capturas comparadas con el original.
- Cambiar a `beta` y publicar preview.

### Fase 3 — Dados y Tapitas

- 5 operaciones, niveles, modos con dados/tapitas, sesiones, ajustes, voz y consejos.
- Tests de inventario de tapitas, respuestas y no repetición.
- Smoke E2E de las 5 operaciones.

### Fase 4 — Miradas

- 3 niveles, 1–3 adultos, sesión de 5 minutos, progreso, voz y tarjetas.
- Tests de fases, esperas, nombres y cierre de sesión.
- Revisión específica de calma visual y carga sensorial.

### Fase 5 — Mira y Dime

- 4 modos × 3 niveles; 184 objetos; sílabas; frases; "Lo dijo"; ajustes.
- Portar `spanish.ts` a `mira-y-dime/rules.ts` o módulo puro equivalente.
- **No** portar: panel de objetos de casa, fotos, IA, Worker, `server/`,
  `wrangler.jsonc`, `.assetsignore`.
- Tests de separación silábica, piezas, plan de sesión y frases.

### Fase 6 — Cierre público

- PWA, manifiesto, service worker.
- CSP final y `_headers`.
- `pnpm check:full` verde.
- Juegos aprobados pasan a `ready`.
- Revisión final de privacidad y créditos.

### Fase 7 — Archivar

- Solo con paridad aprobada.
- Mover los 4 juegos viejos a un archivo fuera del sitio.
- No borrar sin confirmación explícita.

## 11. Fuera de alcance

- Panel "Objetos de casa", fotos, IA, Worker y OpenRouter.
- Cuentas, perfiles, sincronización, backend.
- Analytics, cookies, publicidad.
- Otros idiomas.
- Mando de juego.
- Rediseño visual: se mantiene el brandbook.
- Modo TV de 10 pies.

## 12. Riesgos

| Riesgo                                     | Mitigación                                                                |
| ------------------------------------------ | ------------------------------------------------------------------------- |
| La reescritura pierde comportamiento sutil | Reglas y tests primero, juego por juego, capturas de paridad              |
| `miradas` no tiene commits                 | Baseline antes de empezar                                                 |
| Tailwind + CSS custom se pisan             | Tailwind solo layout; CSS semántico para piezas                           |
| CSP rompe islas Vue/Astro                  | Probar en build; E2E falla con violaciones                                |
| PWA con la versión de Astro                | Verificar en fase 0; si no, SW propio                                     |
| 4K con UI diminuta                         | Ancho máximo + `clamp()` + `3xl`; probar 3840×2160                        |
| Voz distinta por dispositivo               | Preferencia de idioma + `VoiceTest` en ajustes                            |
| Pruebas frenan el avance                   | Nivel A por fase; nivel B solo en fase 6                                  |
| Juegos nuevos rompen la consistencia       | Registro único + `new-game` + requisitos de §6 en componentes compartidos |
| Deploy público con IA accidental           | IA fuera de alcance; sin Worker ni claves                                 |

## 13. Criterio de aprobación final

- `pnpm check:full` verde.
- Los 4 juegos con paridad funcional.
- Requisitos de §6 cumplidos en los 4 juegos.
- `pnpm new-game prueba` genera un juego que compila y pasa su smoke test.
- Sin errores de consola ni CSP.
- Teclado, reduced motion y offline.
- 390×844, 844×390, 1366×900, 2560×1440 y 3840×2160 revisados.
- axe sin violaciones graves.
- Privacidad y créditos publicados.
- Preview `dev.pyloncito.app` aprobado.
- Nada de los juegos viejos borrado.

## 14. GitHub

- Repo: https://github.com/the-bunker-code/pyloncito
- Project: https://github.com/orgs/the-bunker-code/projects/2
- Issues: trabajo ejecutable, en español.
- Ramas permanentes: `main` y `develop`; `feature/*`, `fix/*`, `chore/*` y
  `hotfix/*` son temporales. Todo entra por PR; ver `CONTRIBUTING.md`.
- `ARQUITECTURA.md` y `docs/GITHUB.md`: diseño y flujo.
- `docs/knowledge/DECISIONS.md` del workspace: decisiones de producto.
- Labels, milestones y campos del Project se describen en `docs/GITHUB.md`.
