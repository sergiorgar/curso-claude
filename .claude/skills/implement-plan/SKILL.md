---
name: implement-plan
description: Implementa un plan de trabajo (p. ej. los generados por plan-feature en docs/plans/) en un git worktree aislado, tarea a tarea con TDD estricto, haciendo un commit y marcando la tarea como hecha tras cada una, hasta cumplir los criterios de aceptación. Úsala cuando el usuario pida implementar, ejecutar o llevar a cabo un plan.
argument-hint: [ruta al plan, p. ej. docs/plans/mi-plan.md]
---

# implement-plan

Implementa el plan indicado: $ARGUMENTS

## Pasos

### 0. Localiza y lee el plan

- Si `$ARGUMENTS` está vacío, lista `docs/plans/` y pregunta con `AskUserQuestion` cuál implementar (o usa el único que haya).
- Lee el plan completo: objetivo, alcance, tareas (`- [ ]`) y criterios de aceptación.
- Lee `CLAUDE.md` del proyecto (capas, clases, métodos en `camelCase`, SQL solo en repositories, errores de dominio con `next(error)`, sin dependencias innecesarias, errores en español) y las guías que el plan o `CLAUDE.md` mencionen.
- Si el plan no tiene tareas o criterios de aceptación, o es ambiguo en algo sustancial, detente y consulta al usuario antes de seguir.
- Salta las tareas que ya estén marcadas `- [x]` (permite retomar un plan a medias).

### 1. Crea el git worktree

- Comprueba que el repositorio tiene al menos un commit y anota la rama actual.
- Crea un worktree en una rama nueva con el nombre derivado del plan (slug del archivo), con prefijo según el tipo: `feature/`, `fix/` o `refactor/`:

  ```bash
  git worktree add .claude/worktrees/<slug> -b <tipo>/<slug>
  ```

  Los worktrees viven siempre dentro de `.claude/worktrees/` del repositorio, no fuera de él. Si `.claude/worktrees/` no está ignorado por git, añádelo a `.git/info/exclude` (no a un archivo versionado) para que no aparezca como untracked.
  Si la rama o el directorio ya existen, reutiliza ese worktree (retoma el trabajo) en vez de fallar.
- **Si el plan no está commiteado** (untracked o con cambios), cópialo al mismo path relativo dentro del worktree: el plan que se va marcando es el del worktree.
- Trabaja **siempre dentro del worktree** a partir de este punto (usa `EnterWorktree` si está disponible, o rutas absolutas / `git -C`). Nunca modifiques archivos del directorio principal.
- Ejecuta `npm install` en el worktree si no existe `node_modules`, y copia `.env` del directorio principal si existe (no se versiona; no lo commitees).

### 2. Implementa las tareas una a una con TDD estricto

Procesa las tareas **en orden y de una en una**. Para cada tarea:

1. **RED** — Escribe primero el test que describe el comportamiento de la tarea (con Vitest, `describe`/`it`/`expect`; los tests van junto al código que prueban, como `*.test.ts`, p. ej. `packages/api/src/services/dish.service.test.ts`; para HTTP, `supertest`). Ejecútalo con `npx vitest run <archivo>` desde `packages/api` y **comprueba que falla por la razón correcta** (aserción fallida, no error de sintaxis o de import). Si pasa sin escribir código, el test no sirve: reescríbelo.
2. **GREEN** — Escribe el **mínimo** código de producción para que el test pase. Nada de funcionalidad que ningún test exija.
3. **REFACTOR** — Con los tests en verde, limpia el código y los tests sin cambiar el comportamiento. Vuelve a ejecutar los tests.
4. **Verifica** — Ejecuta la suite completa (`npm test` desde la raíz); debe estar en verde, sin tests rotos ni omitidos.
5. **Commit** — Un commit por tarea, que incluya el código, los tests y el plan con la tarea ya marcada (paso siguiente).
6. **Marca la tarea** — En el plan del worktree cambia `- [ ]` por `- [x]` en esa tarea **antes de commitear**, de modo que el mismo commit refleje el avance.

Reglas del TDD:

- Prohibido escribir código de producción sin un test rojo previo que lo justifique.
- Si una tarea no es testeable de forma automática (p. ej. solo configuración), dilo explícitamente, verifícala de la forma más directa posible (arrancar la app, `curl`) y explica en el commit por qué no hay test.
- Si un test pasa en verde a la primera, o si la tarea resulta ser mucho mayor de lo estimado, para y reevalúa (divide la tarea y actualiza el plan) en lugar de continuar a ciegas.
- Si aparece un bloqueo (requisito contradictorio, dependencia que falta), no improvises: consulta al usuario.
- Respeta las convenciones del proyecto: clases (un archivo = una clase), métodos en `camelCase`, capas `routes → controllers → services → repositories → models`, mensajes de error en español.

#### Formato del commit

[Conventional Commits](https://www.conventionalcommits.org/es/v1.0.0/), **en inglés**, con el pie de coautoría que indique el entorno:

```
<type>(<scope>): <short description of the task>

<optional body>
```

- Añade solo los archivos de la tarea (`git add <archivos>`, nunca `git add -A`) más el plan actualizado.
- No uses `--no-verify` ni amends sobre commits anteriores; si algo falla, arréglalo en un commit nuevo.

### 3. Verifica los criterios de aceptación

Cuando todas las tareas estén `- [x]`:

1. Ejecuta la suite completa de tests.
2. Recorre **cada criterio de aceptación** del plan y compruébalo con evidencia real (un test que lo cubra, o arrancar la API con `npm run dev:api` y probar el endpoint con `curl`). No marques un criterio por suposición.
3. Si un criterio no se cumple o no está cubierto, añade la tarea necesaria al plan (con su `- [ ]`) y vuelve al paso 2 (test rojo primero).
4. Marca `- [x]` cada criterio cumplido y commitea el plan (`docs(plan): mark acceptance criteria as met`).

### 4. Cierre

- Comprueba que `git status` está limpio en el worktree y muestra el `git log --oneline` de la rama.
- Informa al usuario (en español): ruta del worktree, nombre de la rama, tareas completadas, resultado de los tests y estado de cada criterio de aceptación.
- **Avisa por Slack.** Con todas las tareas implementadas y los criterios de aceptación verificados, publica un mensaje en el canal `revisar-plan` con `mcp__slack__slack_post_message` (si hace falta, localiza el ID del canal con `mcp__slack__slack_list_channels`; carga antes los esquemas con `ToolSearch`). El mensaje, en español, indica que la implementación está lista para revisarse e incluye el nombre del plan, la rama, la ruta del worktree y el resultado de los tests. Si falla el envío, informa al usuario y continúa.
- **No hagas merge, push ni elimines el worktree** sin que el usuario lo pida; ofrécele esas opciones (merge a la rama principal, abrir PR, borrar el worktree).

## Idioma

La conversación y las notas van en español. El código, los tests y los mensajes de commit van en inglés (los mensajes de error que ve el usuario final de la API, en español, según `CLAUDE.md`).
