# Publish the committed code (HEAD) to a Hugging Face Docker Space.
# Usage: pwsh deploy/huggingface/publish.ps1 -Space <hf-username>/<space-name>
# Needs: `hf auth login` done once by the account owner (a write token). Uploads only what git tracks.
param(
  [Parameter(Mandatory = $true)][string]$Space
)
$ErrorActionPreference = "Stop"

$repo = (git rev-parse --show-toplevel).Trim()
$stage = Join-Path ([System.IO.Path]::GetTempPath()) ("nabz-space-" + [guid]::NewGuid().ToString("N").Substring(0, 8))
New-Item -ItemType Directory -Path $stage | Out-Null

try {
  # Committed files only; docs, demo assets and tests are not needed to run the app.
  $archive = Join-Path $stage "src.tar"
  git -C $repo archive --format=tar -o $archive HEAD -- . ":(exclude)docs" ":(exclude)demo" ":(exclude)tests" ":(exclude).github"
  tar -xf $archive -C $stage
  Remove-Item $archive

  # The Space needs its Dockerfile and its README (with the YAML header) at the root.
  Copy-Item (Join-Path $repo "deploy/huggingface/Dockerfile") (Join-Path $stage "Dockerfile") -Force
  Copy-Item (Join-Path $repo "deploy/huggingface/README.md") (Join-Path $stage "README.md") -Force

  $commit = (git -C $repo rev-parse --short HEAD).Trim()
  hf upload $Space $stage . --repo-type space --delete "*" --commit-message "Deploy nabz $commit"
  if ($LASTEXITCODE -ne 0) { throw "hf upload failed with exit code $LASTEXITCODE" }
  Write-Host "Uploaded $commit to https://huggingface.co/spaces/$Space"
}
finally {
  Remove-Item -Recurse -Force $stage -ErrorAction SilentlyContinue
}
