# Contribuir

## Idioma

- Issues, documentación de producto y textos de la interfaz: español.
- Código, nombres de archivos, ramas y commits: inglés.

## Flujo

1. Abrí o tomá un issue del Project “Pyloncito”.
2. Esperá el plan de la fase antes de escribir código.
3. Hacé cambios pequeños y verificables.
4. Ejecutá `pnpm check` antes de pedir revisión.
5. Abrí un PR con el template y adjuntá capturas si cambia la interfaz.

## Ramas

Ramas permanentes: `main` y `develop`. Todo lo demás es temporal y se borra después
del merge.

| Rama             | Sale de   | PR hacia           | Merge        |
| ---------------- | --------- | ------------------ | ------------ |
| `feature/<slug>` | `develop` | `develop`          | Squash       |
| `fix/<slug>`     | `develop` | `develop`          | Squash       |
| `chore/<slug>`   | `develop` | `develop`          | Squash       |
| `hotfix/<slug>`  | `main`    | `main` y `develop` | Merge commit |
| `develop`        | —         | `main`             | Merge commit |

Flujo normal:

```bash
git switch develop
git pull
git switch -c feature/mi-cambio
# trabajar
git push -u origin feature/mi-cambio
```

Hotfix:

```bash
git switch main
git pull
git switch -c hotfix/mi-arreglo
# trabajar
git push -u origin hotfix/mi-arreglo
```

Después del PR a `main`, abrí otro PR desde `hotfix/<slug>` hacia `develop`. No hay
rama `hotfix` permanente.

Nunca pushees directo a `main` o `develop`: están protegidas por un ruleset, sin
bypass. Todo entra por PR y requiere `check` + `policy`.

## Pull requests

- `feature/*`, `fix/*` y `chore/*` van a `develop`.
- `hotfix/*` va a `main` y luego a `develop`.
- `develop` va a `main` para un release.
- Usá squash para features, fixes y chores; merge commit para hotfix y release.
- Incluí `Closes #N` para cerrar el issue al mergear a la rama por defecto.
- Un PR no se mergea con checks rojos, conversaciones abiertas o la rama desactualizada.

## Reglas

- No agregues dependencias sin justificarlas en el issue o el PR.
- No dejes `console.log`, `debugger`, `var`, `!important` ni `style=""`.
- No uses `innerHTML` con datos de usuario.
- No toques los repos de los juegos originales durante la migración.
- Mantené la accesibilidad: teclado, foco visible, contraste y `prefers-reduced-motion`.
- Probá 390×844, 1366×900 y, cuando aplique, 4K de monitor.

## Commits

Formato Conventional Commits, en inglés:

```text
feat(shared): add session closing notice
fix(memoria): cancel pending round timer
docs(github): map phases to milestones
```

Para cerrar un issue automáticamente, incluí `Closes #N` en el commit o en el PR.
Sin esa referencia, GitHub no lo cierra; el tablero solo actualiza el estado cuando
el issue ya está cerrado.

## Seguridad

No incluyas secretos, tokens, `.env` ni datos personales. Ver [SECURITY.md](./SECURITY.md).
