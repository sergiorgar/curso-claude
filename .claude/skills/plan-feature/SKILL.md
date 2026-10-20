---
name: plan-feature
description: Planifica un nuevo desarrollo, una corrección de código (bugfix) o un refactor descrito en una issue de GitHub, generando un plan con objetivo, tareas pequeñas (5-10 min cada una) y criterios de aceptación, y publicándolo como comentario de la issue. Úsala cuando el usuario pida planificar, diseñar o desglosar un cambio antes de implementarlo.
argument-hint: [número de la issue de GitHub]
---

# plan-feature

Genera un plan de trabajo para el cambio descrito en la issue de GitHub indicada por el usuario: $ARGUMENTS

Esta skill **solo planifica**: no modifiques código de `src/` ni hagas commits.

## Pasos

1. **Obtén la issue de GitHub.** La tarea a planificar vive en una issue del repositorio. El usuario debe indicar el número de la issue (`$ARGUMENTS`); si no lo ha dado, pídeselo con `AskUserQuestion` antes de continuar. Léela con `gh issue view <número> --comments` (título, cuerpo, etiquetas y comentarios) y usa ese contenido como la petición a planificar. Si `gh` falla (issue inexistente, sin autenticar), informa al usuario y detente.

2. **Entiende la petición.** Identifica si es un desarrollo nuevo (`feature`), una corrección (`fix`) o un refactor. Si la petición es ambigua en algo que cambia el plan de forma sustancial, usa `AskUserQuestion`; si hay un valor por defecto razonable, asúmelo y anótalo en el plan.

3. **Explora el código afectado** antes de planificar (lee los archivos reales, no supongas):
   - Lee `CLAUDE.md` del proyecto: arquitectura (por capas `routes → controllers → services → repositories → models`, o hexagonal en el contexto `employee`), convenciones (clases en las capas, métodos en `camelCase`, SQL solo en repositories, errores de dominio con `next(error)` y formato `{ error, message }`, sin dependencias innecesarias, mensajes de error en español). Para el detalle, lee `docs/arquitectura/arquitectura-api.md` (API) o `arquitectura-frontend.md` (Angular).
   - Si el cambio lista colecciones, comprueba en `CLAUDE.md` si existe ya una guía de paginación y síguela; si no existe, anótalo como supuesto o duda abierta en el plan.
   - Localiza los archivos que habrá que crear o modificar.
   - Determina si el cambio **toca la API** (crear, modificar o eliminar rutas, parámetros, cuerpos de petición o respuesta, modelos expuestos, códigos de estado, roles/permisos o errores). Si es así, lee `docs/api/openapi.yaml` para ver qué partes se verán afectadas.

4. **Redacta el plan** siguiendo exactamente la estructura de [template.md](template.md).

5. **Incluye la documentación de la API en el plan.** Si el cambio toca la API, el plan **debe** contener (ver [template.md](template.md)):
   - Una tarea de «Actualizar `docs/api/openapi.yaml`» con los paths, schemas, parámetros, respuestas y `security` afectados, y otra de «Regenerar `docs/api/index.html` con `npm run docs:api`» (valida el YAML y reconstruye el HTML). Colócalas después de las rutas y antes de la verificación final.
   - Un criterio de aceptación que exija que `openapi.yaml` refleje el cambio y que `npm run docs:api` pase sin errores.
   - Añade `docs/api/openapi.yaml` y `docs/api/index.html` a «Archivos afectados».
   Si el cambio no toca la API, omite estas tareas y no las menciones.

6. **Crea el plan** y guárdalo en `docs/plans/<slug-kebab-case>.md`. Menciona la issue de origen (`#<número>`) en el plan.

7. **Publica el plan en la issue.** Una vez guardado, publícalo como comentario de la issue con `gh issue comment <número> --body-file docs/plans/<slug>.md` (el comentario contiene el plan completo, en español). Si falla la publicación, informa al usuario y continúa; no bloquees el flujo.

8. **Avisa por Slack.** Una vez guardado el plan, publica un mensaje en el canal `revisar-plan` con `mcp__slack__slack_post_message` (si hace falta, localiza el ID del canal con `mcp__slack__slack_list_channels`; carga antes los esquemas con `ToolSearch`). El mensaje, en español, indica que el plan está listo para revisarse e incluye su título, la ruta (`docs/plans/<slug>.md`) y el número de la issue donde se ha publicado. Si falla el envío, informa al usuario y continúa; no bloquees el flujo.

9. **Termina** preguntando al usuario si desea implementarlo o ajustar algo. No empieces a implementar sin su confirmación.

## Reglas para las tareas

- **Cada tarea debe poder hacerse en 5-10 minutos.** Si una tarea parece mayor, divídela en varias. Si es trivial (< 5 min), agrúpala con otra relacionada.
- Cada tarea es una acción concreta y verificable, con el archivo o archivos implicados (rutas reales, p. ej. `packages/api/src/services/dish.service.ts`).
- Ordénalas según el flujo de dependencias del proyecto: de la capa inferior a la superior (models → repositories → services → controllers → routes → documentación OpenAPI si toca la API), y deja los tests o la verificación manual al final.
- Numéralas y marca cada una con una casilla `- [ ]` para poder ir tachándolas.
- Indica la duración estimada de cada tarea (`~5 min`, `~10 min`).
- Las tareas respetan las convenciones del proyecto (clases, `camelCase`, capas, errores de dominio, español en mensajes de error).

## Reglas para los criterios de aceptación

- Redáctalos como condiciones **observables y comprobables** (p. ej. «`GET /x` devuelve 404 con mensaje en español si no existe»), no como intenciones vagas.
- Cubre el camino feliz, los casos de error y las convenciones del proyecto que apliquen.
- En una corrección, incluye siempre un criterio que describa que el fallo original ya no se reproduce; en un refactor, que el comportamiento externo no cambia.

## Idioma

El plan y la conversación van en español. Si el plan incluye fragmentos de código o nombres de archivos, el código va en inglés.
