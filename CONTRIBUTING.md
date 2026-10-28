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

## Seguridad

No incluyas secretos, tokens, `.env` ni datos personales. Ver [SECURITY.md](./SECURITY.md).
