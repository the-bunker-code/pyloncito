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
- Sin scripts de terceros en producción.
- CSP estricta y cabeceras en `_headers`.
- Dependencias fijadas y revisadas.
- Datos de `localStorage` validados al leer.
