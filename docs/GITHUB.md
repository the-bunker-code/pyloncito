# GitHub — Pyloncito

El diseño vive en [`ARQUITECTURA.md`](../ARQUITECTURA.md). El estado del trabajo vive
en el Project “Pyloncito”. Las decisiones de producto se registran en
`docs/knowledge/DECISIONS.md` del workspace.

## Repo

- https://github.com/the-bunker-code/pyloncito
- Público, rama `main`, licencia MIT.
- Issues y labels en español; código y commits en inglés.

## Project

- https://github.com/orgs/the-bunker-code/projects/2
- Nombre: **Pyloncito**
- Visibilidad: privada.
- Vinculado al repo.
- El tablero es la vista de ejecución; no reemplaza la arquitectura.

### Campos

| Campo | Uso |
|---|---|
| Estado | Backlog, Ready, In progress, In review, Done |
| Fase | Fundación, Fase 0–7, Marca |
| Juego | Hub, Dados y Tapitas, Memo Colores, Miradas, Mira y Dime, Compartido |
| Área | Arquitectura, Frontend, Diseño, Contenido, Testing, Deploy, Accesibilidad, Docs |
| Prioridad | P0, P1, P2 |
| Tamaño | XS, S, M, L, XL |

### Vistas

| Vista | Tipo | Filtro / agrupación |
|---|---|---|
| Ahora | Tabla | `-status:Done` |
| Tablero | Board | Columnas por Estado |
| Por juego | Tabla | Agrupar por Juego (manual) |
| Roadmap | Roadmap | Agrupar por Fase (manual) |
| Bloqueados | Tabla | `label:bloqueado` |
| Hecho | Tabla | `status:Done` |

La API creó las vistas y los filtros. El agrupamiento y los workflows se terminan en la
UI porque la API de GitHub no expone todos los ajustes. La vista por defecto “View 1”
se puede renombrar o eliminar.

### Estado inicial

Al 2026-10-28: 49 issues; 7 Done, 5 Ready, 2 In progress y 35 Backlog.

### Reglas del tablero

1. Todo trabajo empieza como issue.
2. Una épica agrupa tareas; una tarea se puede cerrar sola.
3. Un issue bloqueado lleva `bloqueado` y el motivo en el cuerpo.
4. Un issue cerrado sin PR debe explicar la verificación.
5. Al cerrar una fase, actualizar el estado de la épica y el README.

## Labels

| Label | Uso |
|---|---|
| `tipo/epic` | Épica |
| `tipo/tarea` | Tarea |
| `tipo/bug` | Bug |
| `tipo/decision` | Decisión que necesita registro |
| `fase/0` … `fase/7` | Fase del plan |
| `juego/hub` | Hub y páginas públicas |
| `juego/dados` | Dados y Tapitas |
| `juego/memoria` | Memo Colores |
| `juego/miradas` | Miradas |
| `juego/mira-y-dime` | Mira y Dime |
| `juego/compartido` | Shell y librerías compartidas |
| `area/arquitectura` | Arquitectura |
| `area/frontend` | HTML, CSS, Vue, Astro |
| `area/diseno` | Tokens, componentes visuales, marca |
| `area/contenido` | Copy y guía |
| `area/testing` | Tests, E2E, a11y, Lighthouse |
| `area/deploy` | CI, Pages, cabeceras |
| `area/accesibilidad` | WCAG, teclado, movimiento |
| `area/docs` | README y documentación |
| `bloqueado` | No se puede avanzar |
| `necesita-decision` | Requiere una decisión humana |

## Milestones

`Fundación`, `Fase 0` a `Fase 7`, `v1.0`.

## Flujo de una fase

1. La épica de la fase está en `Backlog`.
2. Al aprobar el plan, pasa a `In progress`.
3. Las tareas se mueven a `Ready` antes de empezar.
4. Al cerrar: `pnpm check`, reporte de fase y capturas.
5. La épica pasa a `Done`; la siguiente fase sale de `Backlog`.
