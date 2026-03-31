/**
 * pre-release-check.mjs
 * 发布前统一校验入口脚本
 *
 * 整合 lint、typecheck、test、security audit 与文档检查，
 * 在 `pnpm release:semantic` 前提供完整的最低验证矩阵。
 *
 * 用法:
 *   node scripts/release/pre-release-check.mjs [--skip-e2e] [--mode=warn|error]
 *
 * 选项:
 *   --skip-e2e   跳过 E2E 测试（本地快速校验时使用，CI 中不建议跳过）
 *   --mode=warn  校验失败时仅告警，不中断流程（默认: error）
 */

import { spawn } from 'node:child_process'
import path from 'node:path'
import process from 'node:process'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..', '..')

// ─── CLI 参数解析 ─────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
const skipE2e = args.includes('--skip-e2e')
const mode = args.find((a) => a.startsWith('--mode='))?.slice('--mode='.length) ?? 'error'

if (mode !== 'warn' && mode !== 'error') {
    console.error(`[pre-release-check] 不支持的模式: ${mode}，请使用 warn 或 error`)
    process.exit(1)
}

// ─── 工具函数 ─────────────────────────────────────────────────────────────────

/**
 * 运行命令并返回 { ok, durationMs, output }
 * stdio 继承到父进程，同时把 stderr/stdout 聚集到 output 字符串
 */
function runCommand(command, commandArgs, label) {
    return new Promise((resolve) => {
        const start = Date.now()
        const isWin = process.platform === 'win32'
        const spawnCommand = isWin ? 'cmd.exe' : command
        const spawnArgs = isWin
            ? ['/d', '/s', '/c', [command, ...commandArgs].join(' ')]
            : commandArgs

        const chunks = []
        const child = spawn(spawnCommand, spawnArgs, {
            cwd: repoRoot,
            env: process.env,
            stdio: ['inherit', 'pipe', 'pipe'],
        })

        child.stdout.on('data', (data) => {
            process.stdout.write(data)
            chunks.push(data)
        })
        child.stderr.on('data', (data) => {
            process.stderr.write(data)
            chunks.push(data)
        })

        child.on('error', (error) => {
            resolve({
                ok: false,
                durationMs: Date.now() - start,
                output: `运行错误: ${error.message}`,
                label,
            })
        })
        child.on('exit', (code) => {
            resolve({
                ok: code === 0,
                durationMs: Date.now() - start,
                output: Buffer.concat(chunks).toString('utf8').trim(),
                label,
            })
        })
    })
}

function pnpm(...pnpmArgs) {
    return (label) => runCommand('pnpm', ['run', ...pnpmArgs], label)
}

// ─── 校验步骤定义 ─────────────────────────────────────────────────────────────

/**
 * 每条 step = { label, run, required }
 *   label    - 显示名称 / 证据字段标签
 *   run      - (label) => Promise<{ ok, durationMs, output, label }>
 *   required - 失败时是否阻断后续（mode=error 生效）
 */
const steps = [
    { label: 'lint (ESLint)', run: pnpm('lint'), required: true },
    { label: 'lint:i18n', run: pnpm('lint:i18n'), required: true },
    { label: 'lint:css (Stylelint)', run: pnpm('lint:css'), required: true },
    { label: 'lint:md (Markdown)', run: pnpm('lint:md'), required: false },
    { label: 'typecheck (TypeScript)', run: pnpm('typecheck'), required: true },
    { label: 'test (Vitest)', run: pnpm('test'), required: true },
    { label: 'docs:check:source-of-truth', run: pnpm('docs:check:source-of-truth'), required: false },
    { label: 'security:audit-deps', run: pnpm('security:audit-deps'), required: true },
    { label: 'security:alerts', run: pnpm('security:alerts'), required: true },
]

if (!skipE2e) {
    steps.push({ label: 'test:e2e (Playwright)', run: pnpm('test:e2e'), required: true })
}

// ─── 执行 ─────────────────────────────────────────────────────────────────────

const SEPARATOR = '─'.repeat(60)

console.info(`\n${SEPARATOR}`)
console.info('  墨梅博客 - 发布前校验 (pre-release-check)')
console.info(`  模式: ${mode.toUpperCase()}  |  跳过E2E: ${skipE2e ? '是' : '否'}`)
console.info(`  时间: ${new Date().toISOString()}`)
console.info(`${SEPARATOR}\n`)

const results = []
let hasFatalFailure = false

for (const step of steps) {
    console.info(`\n▶ [${step.label}]`)
    const result = await step.run(step.label)
    results.push(result)

    let status
    if (result.ok) {
        status = '✓ PASS'
    } else if (step.required) {
        status = '✗ FAIL'
    } else {
        status = '⚠ WARN'
    }
    const duration = (result.durationMs / 1000).toFixed(1)
    console.info(`\n${status}  ${step.label}  (${duration}s)`)

    if (!result.ok && step.required && mode === 'error') {
        hasFatalFailure = true
        console.error(`\n[pre-release-check] 致命错误: "${step.label}" 失败，阻断后续校验。`)
        break
    }
}

// ─── 汇总报告 ─────────────────────────────────────────────────────────────────

console.info(`\n${SEPARATOR}`)
console.info('  校验结果汇总')
console.info(SEPARATOR)

const passed = results.filter((r) => r.ok)
const failed = results.filter((r) => !r.ok)

for (const r of results) {
    const icon = r.ok ? '✓' : '✗'
    const duration = (r.durationMs / 1000).toFixed(1)
    console.info(`  ${icon} ${r.label.padEnd(40)} ${duration}s`)
}

console.info(SEPARATOR)
console.info(`  通过: ${passed.length}  失败: ${failed.length}  总计: ${results.length}`)
console.info(SEPARATOR)

// ─── 写入证据文件 ─────────────────────────────────────────────────────────────

const dateStr = new Date().toISOString().slice(0, 10)
const artifactDir = path.join(repoRoot, 'artifacts', 'review-gate')
const artifactPath = path.join(artifactDir, `${dateStr}-pre-release.md`)

const evidenceLines = [
    `# Review Gate Record — pre-release-check`,
    '',
    `- 范围: 发布前统一校验`,
    `- 关联 Todo: 主线2 - 发布链路统一编排`,
    `- 改动类型: 配置 / 脚本 / 发布流程`,
    `- 风险等级: 高（发布前收口）`,
    `- 记录路径: ${path.relative(repoRoot, artifactPath)}`,
    `- 执行时间: ${new Date().toISOString()}`,
    `- 模式: ${mode}  |  跳过E2E: ${skipE2e ? '是' : '否'}`,
    '',
    '## Round 1',
    '',
    '### 最低验证要求',
    '- 目标层级: V0 + V1 + V2 + RG（发布前高风险收口）',
    `- 需要的命令: lint, lint:i18n, lint:css, lint:md, typecheck, test, security:audit-deps, security:alerts${skipE2e ? '' : ', test:e2e'}`,
    '',
    '### 已执行验证',
    '',
]

for (const r of results) {
    evidenceLines.push(`- **${r.label}**: ${r.ok ? 'PASS ✓' : 'FAIL ✗'}  (${(r.durationMs / 1000).toFixed(1)}s)`)
}

evidenceLines.push('')
evidenceLines.push('### Findings')

const blockers = failed.filter((r) => {
    const step = steps.find((s) => s.label === r.label)
    return step?.required
})
const warnings = failed.filter((r) => {
    const step = steps.find((s) => s.label === r.label)
    return !step?.required
})

if (blockers.length > 0) {
    evidenceLines.push('#### blocker')
    blockers.forEach((r, i) => {
        evidenceLines.push(`${i + 1}. RG-B${String(i + 1).padStart(2, '0')} ${r.label} 校验失败`)
        evidenceLines.push('   - 位置: 见上方命令输出')
        evidenceLines.push('   - 风险: 阻断发布流程')
        evidenceLines.push('   - 修复方向: 修复对应检查报告中的错误后重新执行')
    })
} else {
    evidenceLines.push('#### blocker')
    evidenceLines.push('无')
}

if (warnings.length > 0) {
    evidenceLines.push('#### warning')
    warnings.forEach((r, i) => {
        evidenceLines.push(`${i + 1}. ${r.label} 校验未通过（非阻断）`)
    })
} else {
    evidenceLines.push('#### warning')
    evidenceLines.push('无')
}

evidenceLines.push('#### suggest')
evidenceLines.push('无')
evidenceLines.push('')
evidenceLines.push('### Review Gate')

const gateConclusion = (failed.length === 0 || (mode === 'warn' && blockers.length === 0)) ? 'Pass' : 'Reject'
evidenceLines.push(`- 结论: ${gateConclusion}`)
evidenceLines.push(`- 失败原因或通过条件: ${gateConclusion === 'Pass' ? '所有必须检查均通过' : `${blockers.map((r) => r.label).join(', ')} 校验失败，需修复后重跑`}`)
evidenceLines.push(`- 本轮新增问题: ${blockers.length + warnings.length}`)
evidenceLines.push('- 本轮已关闭问题: 0')
evidenceLines.push(`- 待复查问题: ${blockers.length}`)
evidenceLines.push('')
evidenceLines.push('### 未覆盖边界')
evidenceLines.push(skipE2e ? '- E2E 测试（使用 --skip-e2e 跳过）' : '- 无')
evidenceLines.push('')
evidenceLines.push('### 后续补跑计划')
evidenceLines.push(blockers.length > 0 ? '- 修复上述 blocker 后重新执行 `pnpm release:check`' : '- 无')
evidenceLines.push('')

try {
    await mkdir(artifactDir, { recursive: true })
    await writeFile(artifactPath, evidenceLines.join('\n'), 'utf8')
    console.info(`\n  证据文件已写入: ${path.relative(repoRoot, artifactPath)}`)
} catch (writeErrors) {
    console.warn(`\n  [pre-release-check] 证据文件写入失败: ${writeErrors.message}`)
}

// ─── 退出 ─────────────────────────────────────────────────────────────────────

if (hasFatalFailure || (mode === 'error' && failed.some((r) => steps.find((s) => s.label === r.label)?.required))) {
    console.error('\n[pre-release-check] 发布前校验未通过，请修复上述问题后重试。')
    process.exit(1)
}

if (failed.length > 0) {
    console.warn('\n[pre-release-check] 存在非阻断性警告，建议修复后再发布。')
}

console.info('\n[pre-release-check] 发布前校验完成。')
