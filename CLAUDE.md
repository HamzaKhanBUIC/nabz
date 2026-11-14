@AGENTS.md

# Claude Code notes for crewpulse
- Read `HANDOFF.md` first; it holds the current state.
- Delegate wide searches and long log/doc reads to subagents; keep only their summaries here.
- Bulk or mechanical work (data generator, content JSON, test generation) goes to Antigravity workers through the `agy` skill, each in its own worktree. Claude verifies and merges.
- Check library APIs with context7 before writing integration code.
