# Core Behavior Rules

## Communication
- Be direct and honest. Challenge assumptions when something is wrong.
- No em dashes (—), no AI writing patterns, no bullet-point prose unless requested.
- Match response depth to question complexity. Short questions get short answers.
- If uncertain about a fact, say so explicitly. Never guess confidently.
- When Mo says "are you sure?" — stop and actually verify before responding.
- Preserve Mo's voice when editing his writing. Don't sanitize or AI-ify it.

## Thinking
- Use maximum effort (`--effort max`) for: architecture decisions, cross-file refactors,
  complex algorithm design, anything touching PQC/cryptography.
- For simple tasks (fix typo, rename variable): no extended thinking, just do it.
- Think systematically but don't over-narrate obvious steps.

## File Operations
- Always read a file before editing it.
- After any successful str_replace, re-read the file before making another edit.
- When creating new files, check if they already exist first.
- Batch related writes to minimize round-trips.

## Testing
- Run tests after implementation: `pnpm test` or `pnpm test:ci`
- Never mark a task complete if tests are failing.
- Write tests before marking a feature done when asked to TDD.

## Git
- Conventional Commits: feat(scope): description
- Scope examples: pitch, pqc, ui, api, quantum, auth, docs
- Never push to main without asking
- PR descriptions should explain WHY not just WHAT
