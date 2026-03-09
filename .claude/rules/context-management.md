# Context Management Protocol

## /compact Trigger
At ~70% context usage, proactively run `/compact` with these preservation instructions:
- Current RALPH iteration count and phase
- Failing test file paths and error messages
- Active worktree branches (if agent teams running)
- File paths currently being modified
- Task tracker status from CLAUDE.md

## Agent Teams vs Subagents
Prefer agent teams (shared task list, TeammateIdle hooks, Shift+Down navigation) when:
- 3+ parallel work streams exist
- Work streams need to coordinate (e.g., Rust FFI + mobile bridge)
- Long-running tasks benefit from dedicated context windows

Use subagents only when:
- Quick one-off research (< 2 min)
- Task is fully independent with no coordination needed
- Single file scope

## Delegation Protocol
- Research tasks: delegate to subagent (returns summary, protects main context)
- Implementation tasks: use agent teams with worktree isolation
- Review tasks: use agent teams (reviewer needs full context of changes)

## After /compact
1. Re-read CLAUDE.md task tracker
2. Re-read current test status
3. .claude/rules/ files survive compaction (auto-loaded)
4. Resume RALPH at last known phase

## Front-Loading
When context is fresh, batch all file reads in one message. Never read files one-by-one.
