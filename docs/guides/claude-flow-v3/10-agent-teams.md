# 10 -- Agent Team Workflows

> Extracted from Section 9 of the orchestration guide.
> See also: [03-superpowers.md](03-superpowers.md) for agent team feature overview,
> [04-orchestration-tiers.md](04-orchestration-tiers.md) for when to use teams vs subagents.

---

## Enabling Agent Teams

```json
// ~/.claude/settings.json or project .claude/settings.json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  },
  "teammateMode": "in-process"  // or "tmux" for split panes
}
```

Or use the activation script:
```bash
source docs/guides/claude-flow-v3/scripts/activate-all.sh
```

---

## Team Topology for Zipminator

```
                    +--------------+
                    |  You (Human) |
                    +------+-------+
                           | prompt
                    +------v-------+
                    |  Team Lead   | reads CLAUDE.md, docs/guides/
                    |  (Opus 4.6)  | creates task list, assigns work
                    +--+--+--+--+--+
                       |  |  |  |
          +------------+  |  |  +------------+
          |               |  |               |
  +-------v------+ +-----v--v----+ +--------v------+
  | Rust Crypto  | | Native Bridge| | Mobile Integ  |
  | (Sonnet)     | | (Sonnet)     | | (Sonnet)      |
  | worktree     | | worktree     | | worktree      |
  | ratchet.rs   | | C++ JSI      | | TS services   |
  | ffi.rs       | | Swift/Kotlin | | React Native  |
  +--------------+ +--------------+ +---------------+
          |               |               |
          +---------------+---------------+
                          |
                  +-------v------+
                  | Quality Gate |
                  | (Sonnet)     |
                  | TDD + review |
                  +--------------+
```

---

## Controlling the Team

| Action | How |
|--------|-----|
| Cycle between teammates | `Shift+Down` |
| View teammate's session | `Enter` on teammate |
| Interrupt teammate | `Escape` |
| Toggle task list | `Ctrl+T` |
| Message teammate directly | Type message after selecting |
| Shut down teammate | Tell lead: "Ask the X teammate to shut down" |
| Clean up team | Tell lead: "Clean up the team" |

---

## Quality Gates via Hooks

Configure in `.claude/settings.json`:

```json
{
  "hooks": {
    "TaskCompleted": [
      {
        "command": "cd /Users/mos/dev/qdaria/zipminator && cargo test --workspace 2>&1 | tail -5",
        "timeout": 120000
      }
    ],
    "TeammateIdle": [
      {
        "command": "echo 'Review your changes: git diff --stat'",
        "timeout": 5000
      }
    ]
  }
}
```

See [09-ralph-loop.md](09-ralph-loop.md) for the RALPH quality gate cycle.
