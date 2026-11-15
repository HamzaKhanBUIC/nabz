#!/usr/bin/env python3
"""External outcome gate. Exit 0 means every check passed.

Usage:
  python scripts/gate.py              run all checks
  python scripts/gate.py --stop-hook  Claude Code Stop hook mode (reads hook JSON on stdin)

Set COMMANDS to this project's checks (see docs/blueprint/02-agents-and-gates.md).
"""

from __future__ import annotations

import json
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LOG = ROOT / "logs" / "gate-last.log"
# How much failing output to show Claude; the full output goes to LOG.
TAIL_LINES = 40

COMMANDS: list[list[str]] = [
    ["npx", "tsc", "--noEmit"],
    ["npx", "eslint", "."],
    ["npx", "vitest", "run"],
]


def npm_script_missing(cmd: list[str]) -> bool:
    """`npm run X` with no X in package.json is skipped rather than failed."""
    if cmd[:2] != ["npm", "run"] or len(cmd) < 3:
        return False
    pkg = ROOT / "package.json"
    if not pkg.exists():
        return False
    scripts = json.loads(pkg.read_text(encoding="utf-8")).get("scripts", {})
    return cmd[2] not in scripts


def run_gate() -> tuple[bool, str]:
    LOG.parent.mkdir(exist_ok=True)
    report: list[str] = []
    for cmd in COMMANDS:
        label = " ".join(cmd)
        if npm_script_missing(cmd):
            report.append(f"SKIP {label} (no such npm script)")
            continue
        exe = shutil.which(cmd[0])
        if exe is None:
            report.append(f"FAIL {label}: '{cmd[0]}' not found. Run the init script first.")
            return False, "\n".join(report)
        proc = subprocess.run(
            [exe, *cmd[1:]],
            check=False,
            cwd=ROOT,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
        )
        output = (proc.stdout or "") + (proc.stderr or "")
        if proc.returncode != 0:
            LOG.write_text(f"$ {label}\n{output}", encoding="utf-8")
            tail = "\n".join(output.strip().splitlines()[-TAIL_LINES:])
            report.append(f"FAIL {label} (exit {proc.returncode}). Full log: {LOG}\n{tail}")
            return False, "\n".join(report)
        report.append(f"PASS {label}")
    return True, "\n".join(report)


def has_uncommitted_changes() -> bool:
    git = shutil.which("git")
    if git is None:
        return True
    proc = subprocess.run(
        [git, "status", "--porcelain"], check=False, cwd=ROOT, capture_output=True, text=True
    )
    if proc.returncode != 0:
        return True  # not a git repo yet: verify anyway
    return bool(proc.stdout.strip())


def stop_hook() -> int:
    try:
        payload = json.loads(sys.stdin.read() or "{}")
    except json.JSONDecodeError:
        payload = {}
    # A second Stop in the same turn means Claude already tried once; let it stop.
    if payload.get("stop_hook_active") or not has_uncommitted_changes():
        return 0
    ok, report = run_gate()
    if ok:
        return 0
    sys.stderr.write(f"Gate failed. Fix this before finishing:\n{report}\n")
    return 2


def main() -> int:
    if "--stop-hook" in sys.argv:
        return stop_hook()
    ok, report = run_gate()
    print(report)
    print("GATE: PASS" if ok else "GATE: BLOCKED")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
