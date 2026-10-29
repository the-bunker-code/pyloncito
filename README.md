# Pyloncito

Sistema de juegos educativos para aprender jugando.

**Aprender jugando, tapita a tapita.**

Pyloncito reúne cuatro juegos para niñas y niños de 3 a 7 años, pensados para jugar
con un adulto cerca. El sitio es público, estático, sin cuentas y sin publicidad. La
analítica es opcional y solo se activa con consentimiento. El progreso queda en el
dispositivo.

> Estado: Mira y Dime está en beta y ya se puede jugar en `/juegos/mira-y-dime/`.

[Repo](https://github.com/the-bunker-code/pyloncito) ·
[Project](https://github.com/orgs/the-bunker-code/projects/2) ·
[Arquitectura](./ARQUITECTURA.md) ·
[Mapa de GitHub](./docs/GITHUB.md)

## Juegos

| Juego           | Habilidad           | Repo original                                                                     |
| --------------- | ------------------- | --------------------------------------------------------------------------------- |
| Dados y Tapitas | Contar y operar     | [matematicas-con-dados](https://github.com/the-bunker-code/matematicas-con-dados) |
| Memo Colores    | Memoria visual      | [memo-colores](https://github.com/the-bunker-code/memo-colores)                   |
| Miradas         | Atención compartida | [miradas](https://github.com/the-bunker-code/miradas)                             |
| Mira y Dime     | Lenguaje y sílabas  | [mira-dime](https://github.com/the-bunker-code/mira-y-dime)                       |

## Estado

| Área                             | Estado       |
| -------------------------------- | ------------ |
| Cuatro juegos originales         | Hecho        |
| Brandbook y tokens               | Hecho        |
| Arquitectura                     | Hecho        |
| Repo y Project de GitHub         | Hecho        |
| Fase 0 — snapshot y verificación | Hecho        |
| Fase 1A — base Astro + tooling   | Hecho        |
| Ramas y protección               | Hecho        |
| Marca Pyloncito                  | En curso     |
| Fase 1B — hub y sistema visual   | Hecho        |
| Fase 1C — deploy y preview       | En curso     |
| Fase 5 — Mira y Dime             | Hecho (beta) |
| Migración de los cuatro juegos   | Pendiente    |
| PWA, CSP, 4K y deploy final      | Pendiente    |

El tablero muestra el estado actual:
[Project Pyloncito](https://github.com/orgs/the-bunker-code/projects/2). El detalle y el
orden de trabajo están en [ARQUITECTURA.md](./ARQUITECTURA.md) y en
[docs/GITHUB.md](./docs/GITHUB.md). El baseline visual y las versiones están en
[docs/baseline/](./docs/baseline/).

## Desarrollo

Requisitos: Node >= 22.23.4, pnpm >= 10.

```bash
pnpm install
pnpm dev        # servidor local (Astro 7 lo deja en segundo plano)
pnpm exec astro dev stop  # detener el servidor anterior
pnpm new-game <slug>      # crear el esqueleto de un juego nuevo
pnpm check      # lint, formato, tipos, tests, build y E2E
pnpm format     # Prettier
pnpm test       # Vitest
pnpm test:e2e   # Playwright contra dist/
pnpm build      # sitio estático en dist/
```

## Cómo agregar un juego

1. Ejecutá `pnpm new-game mi-juego`.
2. Editá su entrada en `src/config/games.ts`: nombre, ícono, tema, edad, habilidad,
   duración y descripción. El estado arranca en `hidden`.
3. Implementá `rules.ts` con tests, después `engine.ts`, la vista y los ajustes.
4. Pasá el estado a `coming`, `beta` o `ready` cuando corresponda.
5. Ejecutá `pnpm check`.

El generador crea la página `/juegos/<slug>/` con `noindex` y no la muestra en el hub
hasta que cambies su estado.

## Deploy

Cloudflare Workers con static assets y un solo Worker `pyloncito`:

- Producción: `main` → `https://pyloncito.app`.
- Preview de `develop`: `https://dev.pyloncito.app` (preview name `dev`).
- Los previews se limitan a `develop` con la API de Workers Builds; las ramas `feature/*`, `fix/*` y `chore/*` no generan builds de Cloudflare.
- Build command: `pnpm build`.
- Deploy command de producción: `npx wrangler deploy`.
- Preview command: `npx wrangler preview --name dev`.
- `wrangler.jsonc` sirve `./dist` y `_headers`.
- Node: 24 (`NODE_VERSION=24` en el panel).
- `www.pyloncito.app` redirige al apex.

### Configurar el preview de `develop` (una vez)

1. En el Worker `pyloncito` → **Domains**, dejá `pyloncito.app` en
   **Production and Preview** y quitá `dev.pyloncito.app` como Custom Domain.
2. En **Settings → Build → Branch control**, activá **Preview Builds**.
3. Creá un token **user-scoped** en Cloudflare con:
   - `Workers Builds Configuration: Edit`
   - `Workers Scripts: Read`
4. Exportá las variables en tu terminal. No las guardes en el repo:

```bash
export CLOUDFLARE_ACCOUNT_ID="..."
export CLOUDFLARE_API_TOKEN="..."
pnpm cloudflare:branching
```

El script deja producción limitada a `main` y previews limitados a `develop`,
con `npx wrangler preview --name dev`. Verificá antes con:

```bash
DRY_RUN=1 pnpm cloudflare:branching
```

## Ramas y PRs

- `main`: producción, protegida.
- `develop`: integración, protegida.
- `feature/*`, `fix/*`, `chore/*`: salen de `develop` y entran por PR.
- `hotfix/*`: sale de `main`, entra por PR a `main` y después a `develop`.

Nadie pushea directo a `main` ni `develop`. Todo PR requiere `check` + `policy`.
El detalle está en [CONTRIBUTING.md](./CONTRIBUTING.md).

## Privacidad

- Sin cuentas ni perfiles.
- Analítica opcional con consentimiento; sin publicidad.
- Cookies de GA4 solo después de aceptar.
- Progreso local, validado.
- Voz del navegador, silenciable.
- Sin backend ni secretos en el cliente.

## Analítica y cookies

- GTM con el destino GA.
- Sin GTM hasta que la persona acepte **Analítica**. Aceptar solo Mejora no carga GTM ni GA.
- Consent Mode v2 arranca con todo `denied`; al aceptar solo cambia `analytics_storage` a
  `granted`. Las señales de publicidad quedan siempre en `denied`.
- Categorías: Necesarias, Analítica y Mejora.
- Solo en `pyloncito.app`; en `dev` únicamente con `?gtm_debug=1`.
- Web Vitals (`LCP`, `CLS`, `INP`, `FCP`, `TTFB`) con la librería `web-vitals`; se envían solo
  con consentimiento de Analítica.
- Eventos: `game_card_click`, `game_start`, `level_select`, `answer`, `round_complete`,
  `help_used`, `round_said`, `session_complete`, `game_replay`, `game_home`, `game_exit`,
  `settings_open`, `settings_cancel`, `settings_saved`, `voice_test`, `guide_open` y
  `web_vitals`. Sin nombres, fotos, texto libre ni identificadores de usuario.
- Detalle en [cookies](/cookies/) y en la página de privacidad.

Checklist del contenedor GTM:

- Google Tag.
- Consent required para `analytics_storage`; `ad_storage`, `ad_user_data` y
  `ad_personalization` siempre denegados.
- Fields to set: `cookie_expires = 7776000` (90 días).
- `allow_google_signals = false`.
- `allow_ad_personalization_signals = false`.
- `send_page_view = true`.
- `page_location` = variable de capa de datos `page_location` (sin `gtm_debug`).
- `debug_mode` = variable de capa de datos, solo en debug.
- `app_version` = variable de capa de datos desde `package.json`.
- `traffic_type` = variable de capa de datos (`internal` en debug; `external` en producción).
- Un tag GA4 Event con `event_name = {{Event}}` para los eventos permitidos.
- Enhanced Measurement: páginas, scroll y clics salientes. Sin site search, video, descargas ni
  formularios.
- Sin tags de Ads, remarketing ni Floodlight.
- Google Signals, personalización de anuncios y data sharing desactivados en GA4.
- Retención de datos GA4: 2 meses.
- Filtros de tráfico developer (`debug_mode`) e interno.
- Hotjar futuro bajo la categoría Mejora y con CSP actualizada.

## Créditos

- Tipografía Fredoka, SIL Open Font License.
- Íconos Lucide, ISC.
- Emojis Fluent, MIT.
- Juegos originales de Enrique Lazo Bello (ENLABE), The Bunker Code y contribuidores.

## Licencia

MIT. Ver [LICENSE](./LICENSE).
