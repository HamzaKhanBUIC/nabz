# Setup plan (draft for Hamza's approval)

Scope: Hamza's side only, meaning data, backend and AI. Mariam's Node.js frontend and Ameni's UI are not touched.

## 1. What is already installed (checked Nov 14)

| Tool | Status |
|---|---|
| git 2.54, GitHub CLI 2.92 | Installed; GitHub CLI signed in |
| Node 24, npm 11, pnpm 11 | Installed |
| Python 3.13, uv 0.11 | Installed |
| gitleaks 8.30 (secret scanner) | Installed |
| Antigravity CLI 1.5.8 | Signed in; Hydrogen, Argon and Flash models available |
| MCP for Claude | context7 (live library docs) |
| MCP for Antigravity | context7, Playwright (browser) |
| Claude skills | `agentic-architect` (architecture + scaffolding), `agy` (Antigravity workers), `handoff` / `catchup` (session state), `claude-api` (built in) |
| Claude subagents | `core-builder` (builds one feature), `qa-gatekeeper` (tests, can't edit app code), `reviewer` (read-only spec check), `repo-researcher` |
| Docker | Not installed. Not needed. |

Nothing has to be installed before we can start.

## 2. How the agents work together

```
Hamza ── decides, approves pushes, runs the Antigravity app (research / manual work)
  │
Claude Opus (this session) ── orchestrator
  │   plans, writes briefs, owns architecture + formulas, verifies every result,
  │   merges, commits, keeps the tracking files
  │
  ├── Claude subagents (inside Claude Code)
  │     core-builder ── builds one feature in its own worktree
  │     qa-gatekeeper ── runs tests, tries to break it; can only write tests
  │     reviewer ── checks the code against the design; read-only
  │
  └── Antigravity CLI workers (launched by Claude through agy)
        research (read-only), bulk code: data generator, boilerplate, tests
        each writer in its own git worktree, on branch agy/<id>
        Claude is notified automatically when a worker finishes
```

**No-clash rules**
1. One writer per file. Parallel writers each get their own git worktree and branch.
2. Only Claude merges into `main`, and only after the checks pass.
3. Workers and subagents never push, deploy or delete. Pushing to GitHub needs Hamza's OK.
4. The Antigravity app (Hamza) writes only to its own output file or to `research/manual/`.
5. Every brief starts with "read AGENTS.md first". That way, Antigravity gets the same rules even if it doesn't load the file by itself (not verified yet).

**How "done" gets back to Claude**
- Antigravity CLI workers: automatic. Claude gets the result when the job ends.
- Antigravity app: Hamza says "R2 is done" (the app can't message Claude).
- Claude subagents: automatic.

## 3. Tracking (Claude is the only writer of these)

| File | What it holds |
|---|---|
| `features.json` | Every feature, its phase (must / should / later), and whether it passes its test. This is the progress board. |
| `AI-USAGE-LOG.md` | One line per AI job: model, task, branch, result, verified yes/no. It doubles as the submission's "how AI was used" section. |
| `HANDOFF.md` | Current state, so any new session or teammate can pick up |
| `research/README.md` | Research tasks and status |
| git history | One commit per verified piece of work |

## 4. Repo layout (final shape comes from the architecture step)

```
NASA_HACK_COMPTETION/        ← one git repo, private on GitHub
  AGENTS.md  CLAUDE.md       ← shared rules for every agent / Claude-only notes
  HANDOFF.md  features.json  AI-USAGE-LOG.md
  docs/                      ← blueprint, decisions, this plan
  research/                  ← briefs + verified results
  data/                      ← simulator + generated crew data (labelled simulated)
  backend/                   ← Node.js + TypeScript API
  .github/workflows/ci.yml   ← runs the checks on every push
```

Change from earlier: one repo for the whole folder, instead of a `nabz/` subfolder. Research and tracking files live at the root, so this is simpler. Claude's memory also stays tied to this folder.

**Not committed:** `.env`, `node_modules/`, `.playwright-mcp/` logs, and the workshop `.docx` / `.png` files (team-private). This last one is easy to change.

## 5. Security

- The GitHub repo is private. Making it public for submission is a separate decision.
- Never commit secrets:
  - gitleaks runs before every commit and in CI.
  - Only `.env.example` is committed; real keys stay in a local `.env`.
- All crew data is simulated. No real health data in the repo.
- CI on every push: secret scan, typecheck, tests.
- Branch protection on `main` if the GitHub plan allows it for private repos (to check). Otherwise rule 3 above covers it.

## 6. Setup in phases

**Must, now (~30 min, while research runs)**
1. `git init`, `.gitignore`, gitleaks pre-commit hook, first commit.
2. Create the private GitHub repo and push. **Needs Hamza's OK.**

**Must, after research (the careful part)**
3. Hamza runs `/agentic-architect` (only Hamza can start it). It designs the architecture with us, then creates:
   - `AGENTS.md` / `CLAUDE.md`
   - the blueprint
   - `features.json`
   - the test gate
   - role agents
4. Backend skeleton (Node.js + TypeScript), test runner, CI workflow.

**Should**
5. Property-based testing skill (Trail of Bits) to test the formulas on many random inputs. It's on the architect skill's AI/ML list.
6. Dependabot alerts on the repo.

**Later (AI phase)**
7. AI coach: `claude-api` skill (built in), an evals skill (`hamelsmu/evals-skills`, from the AI/ML list), and the API key in `.env`.
8. Voice: no Speechmatics connector found in the MCP registry. We'd use Speechmatics' own SDK. Research it when we get there.

**Skipped on purpose**
- GitHub MCP plugin: the GitHub CLI already does this and is signed in.
- "Data" plugin: built for SQL warehouses, which we don't have.
- Antigravity `data-agent-kit` plugin: large (40 skills, 12 MCP servers), contents not checked. Only look at it if R6 calls for heavy data work.
