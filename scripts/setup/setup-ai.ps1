# scripts/setup/setup-ai.ps1
# 功能：为当前项目的所有 Git Worktree 批量创建 AI 代理/技能的软链接

$links = @{
    ".claude/agents" = ".github/agents"
    ".claude/skills" = ".github/skills"
}

# 1. 获取所有工作树的路径
try {
    $worktrees = git worktree list --porcelain | Select-String "^worktree " | ForEach-Object { $_.ToString().Replace("worktree ", "").Trim() }
} catch {
    Write-Error "无法获取 Git 工作树列表，请确保在 Git 仓库目录中运行。"
    exit 1
}

Write-Host "发现 $($worktrees.Count) 个工作树，开始同步..." -ForegroundColor Cyan

foreach ($wtPath in $worktrees) {
    Write-Host "`n处理工作树: $wtPath" -ForegroundColor Yellow

    foreach ($linkRelPath in $links.Keys) {
        $targetRelPath = $links[$linkRelPath]

        # 统一路径分隔符为 Windows 标准
        $linkPath = Join-Path $wtPath $linkRelPath.Replace('/', '\')
        $targetPath = Join-Path $wtPath $targetRelPath.Replace('/', '\')

        # 如果父目录不存在则创建
        $parent = Split-Path $linkPath
        if (-not (Test-Path $parent)) {
            New-Item -ItemType Directory -Path $parent -Force | Out-Null
        }

        if (-not (Test-Path $linkPath)) {
            Write-Host "  -> 创建链接: $linkRelPath"
            # 使用相对路径创建链接，增强可移植性
            # 链接位于 .claude/ 目录下，目标在 ../.github/ 目录下
            # 所以相对目标路径应改为适配 mklink 的格式
            $targetBasename = "..\" + $targetRelPath.Replace('/', '\')

            # 切换到 link 所在目录执行 mklink，以确保相对路径正确
            Push-Location $parent
            $linkName = Split-Path $linkPath -Leaf
            cmd /c mklink /D "`"$linkName`"" "`"$targetBasename`""
            Pop-Location
        } else {
            Write-Host "  -> 链接已存在: $linkRelPath" -ForegroundColor Gray
        }
    }
}

Write-Host "`n所有工作树同步完成！" -ForegroundColor Green
