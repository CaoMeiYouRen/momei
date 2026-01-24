# scripts/hooks/pre-tool.ps1
# 获取输入 JSON
$rawInput = $input | Out-String
if ([string]::IsNullOrWhiteSpace($rawInput)) { exit 0 }
$inputJson = $rawInput | ConvertFrom-Json

$tool = $inputJson.tool
$arguments = $inputJson.arguments

# 1. 安全拦截：禁止操作敏感文件
if ($tool -eq "run_in_terminal") {
    $command = $arguments.command
    if ($command -match "rm\s+.*\.env" -or $command -match "rm\s+.*\.aim" -or $command -match "rm\s+-rf\s+/") {
        Write-Error "CRITICAL: Dangerous command blocked (Sensitive files protection)."
        exit 1
    }
}

# 2. 规范拦截：针对修改工具的拦截
if ($tool -eq "replace_string_in_file" -or $tool -eq "create_file") {
    $filePath = $arguments.filePath
    $newContent = if ($tool -eq "create_file") { $arguments.content } else { $arguments.newString }

    # 禁止 any 类型 (忽略测试文件和已有定义)
    if ($filePath -notmatch "\.test\.ts$" -and $newContent -match ":\s*any") {
        Write-Error "NORM VIOLATION: Use of 'any' type is forbidden in production code. Please define a proper interface."
        exit 1
    }

    # 禁止 !important (SCSS/Vue)
    if ($filePath -match "\.(vue|scss)$" -and $newContent -match "!important") {
        Write-Error "NORM VIOLATION: Use of '!important' is forbidden in styles. Please use proper CSS specificity."
        exit 1
    }

    # 简单的 Secret 扫描
    $secretPatterns = "v-auth-secret|api_key|password|token"
    if ($newContent -match $secretPatterns -and ($newContent -match '["''][a-zA-Z0-9-]{10,}["'']')) {
        Write-Error "SECURITY: Potential secret or hardcoded credential detected."
        exit 1
    }
}

exit 0
