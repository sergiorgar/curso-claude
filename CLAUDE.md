# CLAUDE.md

Este archivo ofrece orientación a Claude Code (claude.ai/code) cuando trabaja con el código de este repositorio.

## Qué es

Resttek: plataforma de gestión de restaurantes. Monorepo con **npm workspaces** (`packages/*`): una API Node.js y tres apps Angular más una librería compartida.

| Paquete | Qué es |
| --- | --- |
| `packages/api` | API REST (Express 5 + TypeScript, ESM, SQLite con `sqlite3`) |
| `packages/web-admin` | Panel de administración (Angular) |
| `packages/web-empleados` | App de empleados: cocina, barra y salón (Angular) |
| `packages/web-clientes` | App de pedidos para clientes (Angular) |
| `packages/web-shared` | Librería Angular compartida (`@resttek/web-shared`) |

## Comandos (desde la raíz)

- `npm install` — instala todos los paquetes
- `npm run seed` — puebla la base de datos SQLite con datos de ejemplo
- `npm run dev:api` — API en `http://localhost:3000` (`tsx watch`)
- `npm run dev:admin` / `dev:empleados` / `dev:clientes` — apps Angular con proxy a la API
- `npm test` — tests de la API (Vitest)
- `npm run docs:api` — valida `docs/api/openapi.yaml` y regenera `docs/api/index.html`

No hay lint configurado. Los tests de los frontends no se ejecutan desde la raíz.

## Documentación del proyecto

- `docs/arquitectura/`: `arquitectura-general.md`, `arquitectura-api.md`, `arquitectura-frontend.md`. Léelos antes de tocar la capa correspondiente.
- `docs/dominio/`: `glosario.md`, `modelo-datos.md`.
- `docs/api/`: `openapi.yaml` (fuente de verdad de la API) e `index.html` (generado, no se edita a mano).
- `docs/plans/`: planes generados por la skill `plan-feature`.
- `docs/revisiones/`: revisiones de consistencia de la documentación.

## Arquitectura de la API

La API mezcla dos estilos (detalle en `docs/arquitectura/arquitectura-api.md`):

- **Hexagonal + DDD** solo en el contexto `employee` (`src/contexts/employee/`: `domain`, `application` con casos de uso, `infrastructure`).
- **Por capas** en `restaurant`, `dish`, `ingredient`, `order` y `table`:

```
routes → controllers → services → repositories → models
```

Cada una vive en su carpeta de `src/` (`routes`, `controllers`, `services`, `repositories`, `models`). Las rutas componen sus dependencias (repositorio → servicio → controlador) en el propio fichero. `src/contexts/shared/` contiene el value object `Email`, los middlewares (`authenticate`, `authorize`) y el `errorHandler`.

Imports con alias de ruta (`@routes/*`, `@controllers/*`, `@services/*`, `@repositories/*`, `@models/*`, `@errors/*`, `@config/*`, `@employee/*`, `@shared/*`, `@scripts/*`), definidos en `packages/api/tsconfig.json`.

La API se monta bajo `/api/v1` (más `GET /health` en la raíz). Los endpoints públicos están en `/api/v1/public/...`. Roles: `admin`, `manager`, `camarero`, `cocinero`, `cliente`; la autenticación es JWT con `Authorization: Bearer <token>`.

## Errores

- Los errores de dominio extienden `AppError` y están en `src/errors/DomainErrors.ts`. Los services y modelos los lanzan; los controllers los pasan con `next(error)` (nada de `try/catch` que construya la respuesta a mano) y los middlewares igual con `next(new XxxError())`.
- El `errorHandler` traduce el nombre del error a código HTTP (404 not found, 409 conflictos, 401 credenciales/token, 403 permisos, 400 el resto, 500 inesperados). Si creas un error nuevo que no sea 400, añádelo a la lista correspondiente.
- **Formato único de error:** `{ "error": "<NombreDelError>", "message": "<texto en español>" }`.
- Los mensajes que ve el usuario están **en español**.

## Convenciones

- **Clases en las capas por capas** (un archivo = una clase) para controllers, services y repositories; los métodos siguen el `camelCase` existente.
- **SQL solo en repositories.** Ningún otro sitio accede a la base de datos.
- **Sin dependencias nuevas si hay solución nativa** en Node o en lo que el proyecto ya usa.
- **Tests con Vitest**, junto al código que prueban (`*.test.ts`), con dobles en `mocks/`. Para probar HTTP se usa `supertest` (ver `errorHandler.test.ts`).
- **Código y commits en inglés**; mensajes de error de la API y documentación en español. Commits en formato Conventional Commits.

## Documentación de la API (OpenAPI)

Cualquier cambio que toque la API (rutas, parámetros, cuerpos, respuestas, códigos de estado, roles o errores) debe actualizar `docs/api/openapi.yaml` y regenerar el HTML con `npm run docs:api` (que falla si la spec no es válida). La skill `plan-feature` ya incluye estas tareas en los planes que tocan la API.

## Pendiente de documentar

No existe todavía una guía de paginación: `GET /employees` pagina con `limit`/`offset`, pero ningún endpoint devuelve un envoltorio de página. Si se implementa paginación en otro endpoint, crea esa guía en `docs/api/` y enlázala aquí.
