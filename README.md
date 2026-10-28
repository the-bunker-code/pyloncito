# Pyloncito

Sistema de juegos educativos para aprender jugando.

**Aprender jugando, tapita a tapita.**

Pyloncito reúne cuatro juegos para niñas y niños de 3 a 7 años, pensados para jugar
con un adulto cerca. El sitio es público, estático, sin cuentas, sin analytics y sin
publicidad. El progreso queda en el dispositivo.

> Estado: Fase 1A lista. La base Astro compila y pasa `pnpm check`; el hub visual y el
> deploy llegan en 1B y 1C.

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

| Área                             | Estado    |
| -------------------------------- | --------- |
| Cuatro juegos originales         | Hecho     |
| Brandbook y tokens               | Hecho     |
| Arquitectura                     | Hecho     |
| Repo y Project de GitHub         | Hecho     |
| Fase 0 — snapshot y verificación | Hecho     |
| Fase 1A — base Astro + tooling   | Hecho     |
| Marca Pyloncito                  | En curso  |
| Fase 1B — hub y sistema visual   | Pendiente |
| Fase 1C — deploy y preview       | Pendiente |
| Migración de los cuatro juegos   | Pendiente |
| PWA, CSP, 4K y deploy final      | Pendiente |

El tablero muestra el estado actual:
[Project Pyloncito](https://github.com/orgs/the-bunker-code/projects/2). El detalle y el
orden de trabajo están en [ARQUITECTURA.md](./ARQUITECTURA.md) y en
[docs/GITHUB.md](./docs/GITHUB.md). El baseline visual y las versiones están en
[docs/baseline/](./docs/baseline/).

## Desarrollo

Requisitos: Node >= 22.23.4, pnpm >= 10.

```bash
pnpm install
pnpm dev        # servidor local
pnpm check      # lint, formato, tipos, tests, build y E2E
pnpm format     # Prettier
pnpm test       # Vitest
pnpm test:e2e   # Playwright contra dist/
pnpm build      # sitio estático en dist/
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
- Sin cookies, analytics ni publicidad.
- Progreso local, validado.
- Voz del navegador, silenciable.
- Sin backend ni secretos en el cliente.

## Créditos

- Tipografía Fredoka, SIL Open Font License.
- Íconos Lucide, ISC.
- Emojis Fluent, MIT.
- Juegos originales de Enrique Lazo Bello (ENLABE), The Bunker Code y contribuidores.

## Licencia

MIT. Ver [LICENSE](./LICENSE).
