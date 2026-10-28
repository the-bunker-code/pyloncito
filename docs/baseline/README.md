# Baseline de los juegos originales

Material de comparación para la migración a Pyloncito. No es código de producción y no
se modifica.

## Qué contiene

- `MANIFEST.txt`: commit, rama, remoto y estado de cada juego.
- `capturas/<juego>/390x844/`: inicio, ronda y final.
- `capturas/<juego>/1366x900/`: inicio, ronda y final.
- `capturas/console.txt`: errores o warnings de consola; vacío si no hubo.

## Cómo se generaron

- Servidor local propio de cada juego (`node scripts/serve.js`), en puertos 4310–4313.
- Playwright con Chromium, `serviceWorkers: 'block'` y reloj simulado cuando hacía falta.
- Voz del navegador reemplazada por un stub para evitar audio durante la captura.
- Settings de sesión a 3 rondas en los juegos que lo permiten, para llegar al final.
- Capturas de viewport, sin `fullPage`, con animaciones desactivadas.

## Para qué sirven

Comparar que el juego migrado conserve composición, jerarquía, colores y estados. No
son un test visual automático: la revisión es manual, lado a lado.
