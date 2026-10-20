---
description: Crea un commit siguiendo el formato Conventional Commits
argument-hint: [pista opcional sobre el tipo o el alcance]
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(git add:*), Bash(git commit:*)
---

## Contexto

- Estado del repositorio: !`git status --short 2>/dev/null || echo "❌ Git no inicializado"`
- Cambios en staging: !`git diff --cached 2>/dev/null || true`
- Cambios sin añadir a staging: !`git diff 2>/dev/null || true`
- Últimos commits (para seguir el estilo): !`git log --oneline -10 2>/dev/null || echo "(sin commits previos)"`

## Tarea

Crea un único commit con los cambios actuales siguiendo [Conventional Commits](https://www.conventionalcommits.org/es/v1.0.0/). Pista del usuario (puede estar vacía): $ARGUMENTS

### Manejo de casos especiales

- **Si git no está inicializado**: sugiere ejecutar `git init` y luego el comando `/commit` de nuevo.
- **Si no hay commits previos (primer commit)**: procede normalmente; el análisis de histórico no es aplicable.

### Formato

```
<tipo>(<alcance opcional>): <descripción>

<cuerpo opcional>

<pie opcional>
```

- **Tipos permitidos**: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.
- **Alcance**: opcional; un sustantivo corto que indique la zona afectada (p. ej. `auth`, `vendehumo`, `config`).
- **Descripción**: en español, en imperativo o infinitivo según el estilo de los últimos commits, en minúscula, sin punto final y de 72 caracteres como máximo.
- **Cuerpo**: solo si el *porqué* del cambio no es evidente; explica motivación, no un listado de archivos.
- **Cambios incompatibles**: añade `!` tras el tipo/alcance (`feat(auth)!: ...`) y un pie `BREAKING CHANGE: <explicación>`.

### Pasos

1. **Verificaciones previas**:
   - Comprueba que git está inicializado. Si no, sugiere `git init` y detente.
   - Comprueba que hay cambios (`git status`). Si no hay ninguno, díselo y no hagas nada más.
   - Si no hay commits previos (primer commit), procede normalmente; ignora el análisis histórico de estilos.

2. Analiza el diff y decide el tipo y el alcance. Si los cambios mezclan propósitos claramente distintos, propón dividirlos en varios commits en lugar de agruparlos.

3. Si hay cambios en staging, haz commit solo de ellos. Si no hay ninguno, añade con `git add` los archivos relevantes por nombre (no uses `git add -A` ni `git add .`).

4. No incluyas archivos con secretos (`.env`, credenciales, claves). Si aparecen en los cambios, avisa al usuario y exclúyelos.

5. Crea el commit con `git commit -m`. Para mensajes con cuerpo, usa varios `-m`. Si el contexto de la sesión incluye una línea de atribución para commits, añádela como último párrafo.

6. Usa la tool `AskUserQuestion` para mostrarle al usuario el mensaje del commit, y que decida si le parece bien. Si te da el ok, continua. Si te dice que no, proponle otro mensaje y vuelve a preguntarle.

7. No uses `--no-verify`, no hagas `--amend` ni `git push`, salvo que el usuario lo pida expresamente.

8. Si el commit falla (p. ej. por un hook), corrige el problema y crea un commit nuevo; no lo fuerces.

9. Al terminar, muestra el mensaje del commit creado y su hash corto.
