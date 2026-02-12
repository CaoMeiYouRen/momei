# scripts/setup/setup-ai.ps1
$links = @{
    ".claude/agents" = ".github/agents"
    ".claude/skills" = ".github/skills"
}

$root = (Get-Location).Path

foreach ($linkRelPath in $links.Keys) {
    $targetRelPath = $links[$linkRelPath]

    # 转换为绝对路径并统一 Windows 路径分隔符
    $linkPath = Join-Path $root $linkRelPath.Replace('/', '\')
    $targetPath = Join-Path $root $targetRelPath.Replace('/', '\')

    if (-not (Test-Path $linkPath)) {
        $parent = Split-Path $linkPath
        if (-not (Test-Path $parent)) {
            New-Item -ItemType Directory -Path $parent -Force | Out-Null
        }

        Write-Host "Creating symlink: $linkPath -> $targetPath"
        # 使用引号包裹路径以处理空格，并修复 cmd 调用语法
        cmd /c mklink /D "`"$linkPath`"" "`"$targetPath`""
    } else {
        Write-Host "Link already exists: $linkPath"
    }
}
