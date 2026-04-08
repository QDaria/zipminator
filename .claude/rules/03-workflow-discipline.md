# Workflow Discipline Rules

## File Hygiene
- NEVER create files in project root. Screenshots -> docs/screenshots/, temp -> _tmp/
- NEVER create CLAUDE.md files outside project root (/) and .claude/
- Prompt versions go in docs/guides/prompts/AESR/v{N}/
- Master paper prompts go in docs/guides/prompts/master-prompts/

## Mandatory Planning
- Start non-trivial tasks with plan mode (Shift+Tab or /plan)
- Non-trivial = touches 2+ files, changes architecture, or takes >5 minutes
- Trivial tasks (typo, single-line fix): just do it

## Mandatory /simplify
- Run after every implementation before marking done
- Check for: duplicated logic, dead code, naming, unnecessary abstractions

## Mandatory Checklists
- Create TodoWrite items for any task with 3+ steps
- Update progress as each step completes

## Context Management
- /compact at 50-60% context usage
- Preserve: current task state, failing tests, active branches, modified files

## Thinking Budget
- Default to maximum effort (128K tokens)
- Reduce only for trivial operations

## Autonomy
- Do routine fixes without asking: lint, formatting, type errors, obvious bugs
- ASK before: architecture changes, new dependencies, API contract changes
- When told "just do it" or "fix it": complete the entire fix, no checkpoints

## Session Continuity
- Do not stop prematurely. Continue until task is fully complete.
- "Done" = code works, tests pass, no lint errors, screenshot if UI

## Skill Auto-Selection
- Before tasks, check available skills and use the most specific one
- Chain: /plan -> /batch-tdd -> /simplify
