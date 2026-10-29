# Seguridad

## Qué cubre este proyecto

Pyloncito es un sitio estático. No tiene backend, cuentas, base de datos ni claves en
el cliente. El riesgo principal está en dependencias, contenido publicado y manejo de
`localStorage` y voz del navegador.

## Cómo reportar

No abras un issue público con detalles explotables. Usá un
[security advisory privado](https://github.com/the-bunker-code/pyloncito/security/advisories/new)
o contactá a los mantenedores de The Bunker Code.

Incluí:

- Versión o commit afectado.
- Navegador y sistema.
- Pasos para reproducir.
- Impacto esperado.
- Si es posible, una prueba de concepto mínima.

## Fuera de alcance

- Contenido de los juegos originales sin relación con este repo.
- Ataques que dependan de una extensión o un navegador comprometido.
- Reportes automáticos sin pasos reproducibles.

## Prácticas del proyecto

- Sin secretos versionados.
- Terceros solo después del consentimiento: GTM y GA. Sin publicidad ni otros scripts.
- Dependencias fijadas y revisadas.
- Datos de `localStorage` validados al leer.

## CSP y cabeceras

La política se aplica en dos capas:

- **Meta CSP generada por Astro** (`security.csp` en `astro.config.mjs`) en cada página:
  `default-src`, `base-uri`, `form-action`, `object-src`, `frame-src`, `font-src`,
  `img-src`, `connect-src`, `script-src`, `style-src-elem` y `style-src-attr`.
- **CSP HTTP en `public/_headers`**: `frame-ancestors 'none'` (no es válido dentro de
  `<meta>`) y `script-src-attr 'none'`.

Decisiones conscientes:

- `script-src` permite `'self'`, `https://www.googletagmanager.com` y `'unsafe-inline'`.
  GTM inyecta scripts inline cuando el adulto acepta analítica. No hay HTML de usuario,
  no hay manejadores inline y `script-src-attr 'none'` bloquea atributos de evento.
  Queda pendiente quitar `'unsafe-inline'` con nonce/hash o con analítica self-hosted.
- `style-src-attr 'unsafe-inline'` solo cubre las custom properties dinámicas de
  `AdultGate` y `ProgressBar`; el resto de estilos usa hashes de Astro.
- `Referrer-Policy: strict-origin-when-cross-origin` evita filtrar rutas completas y
  conserva el origen que GA necesita para atribución.
- `_headers` lo aplica Cloudflare Workers static assets. El servidor local
  `scripts/serve.mjs` no aplica cabeceras HTTP; en local solo se prueba el meta CSP.
- Caché: `/_astro/*` y `/fonts/*` inmutables; `/objects/*` un día con
  `stale-while-revalidate` de siete días.
- HSTS, CORP, COOP y `Permissions-Policy` restrictiva completan las cabeceras.

Los IDs de GTM y GA son públicos por naturaleza; no son secretos.
