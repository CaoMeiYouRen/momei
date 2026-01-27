# scripts/setup-ai.ps1
$links = @{
    ".claude/agents" = ".github/agents"
    ".claude/skills" = ".github/skills"
}

foreach ($dest in $links.Keys) {
    if (-not (Test-Path $dest)) {
        $parent = Split-Path $dest
        if (-not (Test-Path $parent)) { New-Item -ItemType Directory -Path $parent }
        cmd /c mklink /D (Resolve-Path -Path ".").Path + "\" + $dest (Resolve-Path -Path ".").Path + "\" + $links[$dest]
    }
}
