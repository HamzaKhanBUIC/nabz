$ErrorActionPreference = 'Stop'
if (Test-Path package.json) { npm install }
python scripts/gate.py
