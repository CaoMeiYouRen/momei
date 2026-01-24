# scripts/hooks/post-tool.ps1
# 获取输入 JSON
$inputJson = $input | Out-String | ConvertFrom-Json

# 仅在工具执行成功且属于修改类工具时运行
if ($inputJson.outcome -eq "success" -and ($inputJson.tool -eq "replace_string_in_file" -or $inputJson.tool -eq "create_file")) {
    $filePath = $inputJson.arguments.filePath
    $absolutePath = Resolve-Path $filePath

    # 1. 自动 Lint 修复 (异步友好，设定超短时长以免阻塞)
    if ($filePath -match "\.(ts|vue|js)$") {
        & pnpm eslint --fix $absolutePath
    }
    if ($filePath -match "\.(vue|scss)$") {
        & pnpm stylelint --fix $absolutePath
    }

    # 2. 提示相关测试 (不运行，仅输出信息)
    $testFile = $filePath -replace "\.(ts|vue)$", ".test.ts"
    if (Test-Path $testFile) {
        Write-Host "QA SUGGESTION: Related test file found: $testFile. Consider running: pnpm test $(Split-Path $testFile -Leaf)"
    }
}

exit 0
