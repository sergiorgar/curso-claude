---
name: plan-feature
description: Planifica un nuevo desarrollo, una corrección de código (bugfix) o un refactor, generando un plan con objetivo, tareas pequeñas (5-10 min cada una) y criterios de aceptación. Úsala cuando el usuario pida planificar, diseñar o desglosar un cambio antes de implementarlo.
argument-hint: [descripción de la funcionalidad, corrección o refactor]
---

# plan-feature

Genera un plan de trabajo para el cambio que describe el usuario: $ARGUMENTS

Esta skill **solo planifica**: no modifiques código de `src/` ni hagas commits.

## Pasos

1. **Entiende la petición.** Identifica si es un desarrollo nuevo (`feature`), una corrección (`fix`) o un refactor. Si la petición es ambigua en algo que cambia el plan de forma sustancial, usa `AskUserQuestion`; si hay un valor por defecto razonable, asúmelo y anótalo en el plan.

2. **Explora el código afectado** antes de planificar (lee los archivos reales, no supongas):
   - Lee `CLAUDE.md` del proyecto: arquitectura por capas (`routers → controllers → services → repositories → models`), convenciones (clases, métodos en `snake_case`, SQLite con `node:sqlite` solo en repositories, sin dependencias innecesarias, mensajes de error en español).
   - Si el cambio lista colecciones, lee `docs/api/api-paginacion.md` y la guía de paginación enlazada en `CLAUDE.md`.
   - Localiza los archivos que habrá que crear o modificar.
   - Determina si el cambio **toca la API** (crear, modificar o eliminar rutas, parámetros, cuerpos de petición o respuesta, modelos expuestos, códigos de estado, roles/permisos o errores). Si es así, lee `docs/api/openapi.yaml` para ver qué partes se verán afectadas.

3. **Redacta el plan** siguiendo exactamente la estructura de [template.md](template.md).

4. **Incluye la documentación de la API en el plan.** Si el cambio toca la API, el plan **debe** contener (ver [template.md](template.md)):
   - Una tarea de «Actualizar `docs/api/openapi.yaml`» con los paths, schemas, parámetros, respuestas y `security` afectados, y otra de «Regenerar `docs/api/index.html` con `npm run docs:api`» (valida el YAML y reconstruye el HTML). Colócalas después de los routers y antes de la verificación final.
   - Un criterio de aceptación que exija que `openapi.yaml` refleje el cambio y que `npm run docs:api` pase sin errores.
   - Añade `docs/api/openapi.yaml` y `docs/api/index.html` a «Archivos afectados».
   Si el cambio no toca la API, omite estas tareas y no las menciones.

5. **Crea el plan** y guárdalo en `docs/plans/<slug-kebab-case>.md`.

6. **Avisa por Slack.** Una vez guardado el plan, publica un mensaje en el canal `revisar-plan` con `mcp__slack__slack_post_message` (si hace falta, localiza el ID del canal con `mcp__slack__slack_list_channels`; carga antes los esquemas con `ToolSearch`). El mensaje, en español, indica que el plan está listo para revisarse e incluye su título y la ruta (`docs/plans/<slug>.md`). Si falla el envío, informa al usuario y continúa; no bloquees el flujo.

7. **Termina** preguntando al usuario si desea implementarlo o ajustar algo. No empieces a implementar sin su confirmación.

## Reglas para las tareas

- **Cada tarea debe poder hacerse en 5-10 minutos.** Si una tarea parece mayor, divídela en varias. Si es trivial (< 5 min), agrúpala con otra relacionada.
- Cada tarea es una acción concreta y verificable, con el archivo o archivos implicados (rutas reales, p. ej. `src/services/vendehumoService.js`).
- Ordénalas según el flujo de dependencias del proyecto: de la capa inferior a la superior (models → repositories → services → controllers → routers → documentación OpenAPI si toca la API), y deja los tests o la verificación manual al final.
- Numéralas y marca cada una con una casilla `- [ ]` para poder ir tachándolas.
- Indica la duración estimada de cada tarea (`~5 min`, `~10 min`).
- Las tareas respetan las convenciones del proyecto (clases, `snake_case`, capas, español en mensajes de error).

## Reglas para los criterios de aceptación

- Redáctalos como condiciones **observables y comprobables** (p. ej. «`GET /x` devuelve 404 con mensaje en español si no existe»), no como intenciones vagas.
- Cubre el camino feliz, los casos de error y las convenciones del proyecto que apliquen.
- En una corrección, incluye siempre un criterio que describa que el fallo original ya no se reproduce; en un refactor, que el comportamiento externo no cambia.

## Idioma

El plan y la conversación van en español. Si el plan incluye fragmentos de código o nombres de archivos, el código va en inglés.
