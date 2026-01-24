# scripts/hooks/session-end.ps1
# 获取输入 JSON
$inputJson = $input | Out-String | ConvertFrom-Json

$logPath = "logs/copilot-sessions.log"
if (!(Test-Path "logs")) { New-Item -ItemType Directory -Path "logs" }

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$sessionSummary = "--- Session Summary [$timestamp] ---`n"
$sessionSummary += "Total Tool Calls: $($inputJson.events.Count)`n"

# 统计变更的文件
$modifiedFiles = $inputJson.events | Where-Object { $_.tool -match "replace|create" } | ForEach-Object { $_.arguments.filePath } | Select-Object -Unique
if ($modifiedFiles) {
    $sessionSummary += "Modified Files:`n"
    foreach ($file in $modifiedFiles) {
        $sessionSummary += "- $file`n"
    }
}

# 写入日志
Add-Content -Path $logPath -Value $sessionSummary

# 提示更新 Todo
Write-Host "SESSION END: Work recorded. Please check docs/plan/todo.md to mark completed tasks."

exit 0
