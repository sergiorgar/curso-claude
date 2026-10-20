# Plan: Unificar el formato de errores de la API

**Tipo:** fix
**Duración total estimada:** ~90 min
**Estado:** plan retroactivo. Los cambios ya estaban implementados y verificados (70 tests pasando) cuando se redactó; se documenta para dejar constancia.

## Objetivo

La API devolvía los errores con dos formatos distintos (`{ error, message }` desde el `errorHandler` y `{ error }` desde los middlewares de autenticación y `OrderController`). Además, `PATCH /orders/{orderId}/items/{itemId}/status` devolvía 400 cuando el pedido no existía (en `GET /orders/{id}` sí devolvía 404) y los mensajes de error estaban en inglés. El comportamiento esperado es un único formato `{ error, message }`, códigos HTTP coherentes y mensajes en español.

## Alcance

- **Incluye:** formato de error único; 404 para `OrderNotFoundError` y el nuevo `OrderItemNotFoundError`; 401/403 para los errores de token y permisos; `OrderController` y middlewares delegando en `errorHandler`; mensajes en español; errores de dominio en lugar de `Error` genéricos en `dish.model.ts`; tests; documentación.
- **No incluye:** correcciones de `seed.ts` (errores previos de `tsc`), tests HTTP de las rutas, cambios en los frontends.
- **Archivos afectados:**
  - `packages/api/src/errors/DomainErrors.ts`
  - `packages/api/src/models/dish.model.ts`, `ingredient.model.ts`
  - `packages/api/src/contexts/employee/domain/value-objects/Role.ts`
  - `packages/api/src/services/order.service.ts`
  - `packages/api/src/controllers/order.controller.ts`
  - `packages/api/src/contexts/shared/infrastructure/http/errorHandler.ts`, `middlewares.ts`
  - `packages/api/src/contexts/shared/infrastructure/http/errorHandler.test.ts` (nuevo)
  - Tests existentes con mensajes traducidos y `order.service.test.ts`
  - `docs/api/openapi.yaml`, `docs/api/index.html`
  - `docs/arquitectura/arquitectura-api.md`
- **Supuestos:** no existe `CLAUDE.md` en el proyecto; las convenciones se han tomado del código y de `docs/arquitectura/arquitectura-api.md`. Los frontends solo leen `err.error.message`, por lo que el cambio de formato no los rompe.

## Tareas

> Cada tarea dura entre 5 y 10 minutos. Orden: models → repositories → services → controllers → routers → verificación.

- [x] **1. Traducir al español los mensajes de los errores existentes y añadir `OrderItemNotFoundError`, `IngredientIdRequiredError`, `InvalidIngredientQuantityError`, `MissingTokenError`, `MalformedTokenError`, `InvalidTokenError`, `InsufficientPermissionsError` y `RestaurantIdQueryRequiredError`** — `packages/api/src/errors/DomainErrors.ts` (~10 min)
- [x] **2. Traducir los mensajes de validación de `Role` y de las funciones `normalize*`** — `packages/api/src/contexts/employee/domain/value-objects/Role.ts`, `packages/api/src/models/ingredient.model.ts`, `packages/api/src/models/dish.model.ts` (~5 min)
- [x] **3. Sustituir los `Error` genéricos de `validateDishIngredient` por los nuevos errores de dominio** — `packages/api/src/models/dish.model.ts` (~5 min)
- [x] **4. Lanzar `OrderItemNotFoundError` cuando el ítem no existe en el pedido** — `packages/api/src/services/order.service.ts` (~5 min)
- [x] **5. Mapear en el `errorHandler` los nuevos errores (404, 401, 403) y traducir el mensaje del 500** — `packages/api/src/contexts/shared/infrastructure/http/errorHandler.ts` (~10 min)
- [x] **6. Hacer que `authenticate` y `authorize` deleguen en `next(new XxxError())`** — `packages/api/src/contexts/shared/infrastructure/http/middlewares.ts` (~10 min)
- [x] **7. Reescribir `OrderController` para delegar siempre en `next(error)`** — `packages/api/src/controllers/order.controller.ts` (~10 min)
- [x] **8. Actualizar `openapi.yaml`: eliminar `SimpleError`, usar `Error` en todas las respuestas, añadir el 404 del PATCH de ítems y describir los errores de 401/403/400** — `docs/api/openapi.yaml` (~10 min)
- [x] **9. Regenerar el HTML con `npm run docs:api`** — `docs/api/index.html` (~5 min)
- [x] **10. Actualizar las secciones de middlewares, gestión de errores y tests** — `docs/arquitectura/arquitectura-api.md` (~10 min)
- [x] **11. Actualizar los tests existentes (mensajes en español y `OrderItemNotFoundError`)** — `packages/api/src/**/*.test.ts` (~10 min)
- [x] **12. Añadir tests con `supertest` del formato de error, 401, 404 y 400** — `packages/api/src/contexts/shared/infrastructure/http/errorHandler.test.ts` (~10 min)

## Criterios de aceptación

- [x] Toda respuesta de error de la API tiene la forma `{ "error": "<NombreDelError>", "message": "<texto en español>" }`.
- [x] Una petición sin token a una ruta protegida devuelve 401 con `error: "MissingTokenError"`; con token inválido, 401 con `InvalidTokenError`; con rol sin permisos, 403 con `InsufficientPermissionsError`.
- [x] `PATCH /orders/{orderId}/items/{itemId}/status` devuelve 404 si el pedido o el ítem no existen, y 400 si el estado no es válido.
- [x] El fallo original ya no se reproduce: el mismo `OrderNotFoundError` devuelve 404 en `GET /orders/{id}` y en el PATCH de ítems.
- [x] `validateDishIngredient` lanza errores de dominio (400) en vez de `Error` genéricos (500).
- [x] `docs/api/openapi.yaml` refleja el cambio y `npm run docs:api` termina sin errores.
- [x] `npm test` pasa (70 tests).
- [x] Se respetan las convenciones del proyecto (capas, clases, mensajes de error en español).

## Riesgos y dudas abiertas

- Los clientes externos que leyeran el campo `error` de los 401/403 (antes, p. ej., `Unauthorized: No token provided`) verán ahora el nombre del error, y el texto pasa a `message`.
- Los mensajes de error de `seed.ts` y los `console.error` siguen en inglés; quedan fuera del alcance.
- Este trabajo se hizo sin planificar ni usar `implement-plan` (sin worktree, sin TDD estricto y sin commits por tarea); el plan se redactó después.
