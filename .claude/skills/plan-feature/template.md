# Plan: <título corto del cambio>

**Tipo:** <feature | fix | refactor>
**Duración total estimada:** <suma de las tareas, p. ej. ~45 min>

## Objetivo

<Qué se quiere conseguir y por qué, en 2-4 frases. En un fix, describe el comportamiento erróneo actual y el esperado.>

## Alcance

- **Incluye:** <qué entra en este cambio>
- **No incluye:** <qué queda fuera a propósito>
- **Archivos afectados:** <lista de rutas que se crearán o modificarán>
- **Supuestos:** <decisiones tomadas por defecto; omitir si no hay>

## Tareas

> Cada tarea dura entre 5 y 10 minutos. Orden: models → repositories → services → controllers → routes → verificación.

- [ ] **1. <acción concreta>** — `<ruta/del/archivo.ts>` (~5 min)
- [ ] **2. <acción concreta>** — `<ruta/del/archivo.ts>` (~10 min)
- [ ] **3. <acción concreta>** — `<ruta/del/archivo.ts>` (~5 min)
- [ ] **N-1. Actualizar la spec OpenAPI** — `docs/api/openapi.yaml` (~5-10 min) _(solo si el cambio toca la API)_
- [ ] **N. Regenerar el HTML con `npm run docs:api`** — `docs/api/index.html` (~5 min) _(solo si el cambio toca la API)_

## Criterios de aceptación

- [ ] <condición observable y comprobable 1>
- [ ] <condición observable y comprobable 2>
- [ ] <caso de error: código HTTP y mensaje en español>
- [ ] `docs/api/openapi.yaml` refleja el cambio y `npm run docs:api` termina sin errores _(solo si toca la API)_
- [ ] Se respetan las convenciones del proyecto (capas, clases, métodos en `camelCase`).

## Riesgos y dudas abiertas

- <riesgo o pregunta pendiente; omitir la sección si no hay>
