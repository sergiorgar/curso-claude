# CLAUDE.md

Este archivo ofrece orientación a Claude Code (claude.ai/code) cuando trabaja con el código de este repositorio.

## Comandos

- `npm install` — instala las dependencias
- `npm start` — arranca la API (`node --env-file=.env src/index.js`); requiere un `.env`
- `npm run dev` — arranca con recarga automática (`--watch`)

Todavía no hay configuración de build, lint ni tests.

## Documentación del proyecto

- `docs`:
-- `api`:
--- `api-paginacion.md`: Lee este documento cada vez que necesites implementar la paginación en un endpoint.

## Arquitectura

API con Express (CommonJS, sin paso de build). `src/index.js` crea la app, habilita `express.json()`, monta los routers y escucha en `PORT` (por defecto 3000).

El código se organiza por capas. Cada capa solo depende de la inmediatamente inferior:

```
routers → controllers → services → repositories → models
```

- **routers**: definen las rutas HTTP y las asocian a un controller. Sin lógica.
- **controllers**: leen la petición (`req`), validan la entrada, llaman al service y construyen la respuesta HTTP (códigos de estado y cuerpo).
- **services**: lógica de negocio (p. ej. hash de contraseñas, emisión del JWT). No conocen `req` ni `res`.
- **repositories**: único punto de acceso a los datos. Ocultan dónde se almacenan (hoy en memoria, mañana una base de datos).
- **models**: definición de las entidades (p. ej. `User`).

Cada capa vive en su propio directorio dentro de `src/` (`src/routers`, `src/controllers`, `src/services`, `src/repositories`, `src/models`).

Endpoints actuales:

- `GET /health` devuelve `{ ok: true }`.
- `POST /auth/register` y `POST /auth/login` (login con email y contraseña, devuelve un JWT).

Piezas transversales: `src/config.js` (lee las variables de entorno y exige `JWT_SECRET`), `src/errors.js` (`AppError` con código HTTP) y `src/middlewares/errorHandler.js`. Los services lanzan `AppError` y el error handler lo convierte en la respuesta; los controllers no hacen `try/catch`.

## Convenciones

- **Sin librerías externas si hay solución nativa en Node.** Antes de añadir una dependencia, comprueba si Node lo resuelve con sus módulos integrados (`crypto`, `node:test`, `--env-file`, `--watch`, `fetch`, etc.). Solo se añade una dependencia cuando no existe alternativa nativa razonable (p. ej. Express para el servidor HTTP o `jsonwebtoken` para JWT).
- **Variables de entorno desde un archivo `.env`** (o similar), no definidas a mano en el código. Se cargan con la opción nativa de Node `--env-file=.env`, sin `dotenv`. `.env` está en `.gitignore`; si se necesita documentar las variables, usar un `.env.example` sin valores reales.
- Variables actuales: `PORT` (por defecto 3000), `JWT_SECRET` (obligatoria, la app no arranca sin ella), `JWT_EXPIRES_IN` (por defecto `1h`). Para un entorno nuevo: `cp .env.example .env` y rellenar `JWT_SECRET`.
- **Clases en las capas, no funciones sueltas.** Los archivos de routers, controllers, services, repositories y models exportan una clase, y la lógica va en métodos de esa clase (no en funciones sueltas a nivel de módulo). Un archivo = una clase.
- **Los métodos van en `snake_case`** (p. ej. `find_by_email`, `register_user`). Se aplica a los métodos de las clases de todas las capas.
- **Base de datos: SQLite.** Los datos se persisten en SQLite, accedido solo desde la capa de repositories (ningún otro sitio ejecuta SQL). Siguiendo la regla de «sin librerías externas», usar el módulo nativo `node:sqlite` en lugar de un paquete npm, salvo que no sea viable en la versión de Node del proyecto. La ruta del archivo de la base de datos se configura por variable de entorno en `.env`.

> Estado: el código existente aún no cumple estas tres últimas convenciones. Los archivos de las capas exportan funciones en `camelCase` y `src/repositories/userRepository.js` sigue usando un `Map` en memoria (los usuarios se pierden al reiniciar). Hay que migrarlos; el código nuevo debe cumplirlas desde el principio.
- Los mensajes de error que ve el usuario están en español; mantener esa coherencia.

## Índice de guías

Consulta la guía correspondiente antes de implementar lo que describe:

- **Paginación** (cualquier endpoint que liste colecciones): sigue [guia-estilos.md](guia-estilos.md) (patrón `ResponsePage` con `self`, `first`, `prev`, `next`, `last` e `items`). Implementación de referencia: `GET /vendehumos` en `src/controllers/vendehumoController.js`.
