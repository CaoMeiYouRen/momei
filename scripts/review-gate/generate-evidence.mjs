/**
 * generate-evidence.mjs
 * Review Gate 证据模板自动生成脚本
 *
 * 读取当前 git 变更文件，自动判断改动类型与最低验证层级，
 * 运行静态检查，并输出预填充的证据 Markdown 到 artifacts/review-gate/。
 *
 * 用法:
 *   node scripts/review-gate/generate-evidence.mjs [--scope=<name>] [--run-checks] [--staged-only]
 *
 * 选项:
 *   --scope=<name>    证据文件的 scope 标识（默认从 git 分支推断）
 *   --run-checks      执行静态检查（lint + typecheck），而不只是生成模板
 *   --staged-only     仅分析 staged（暂存区）文件，不包括工作区未暂存变更
 */

import { spawn, execSync } from 'node:child_process'
import path from 'node:path'
import process from 'node:process'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { parseCliOptions } from '../shared/cli.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..', '..')

// ─── CLI 参数解析 ─────────────────────────────────────────────────────────────

const { runChecks, scope: scopeArg, stagedOnly } = parseCliOptions(process.argv, {
    defaults: {
        runChecks: false,
        scope: null,
        stagedOnly: false,
    },
    flags: {
        '--run-checks': { key: 'runChecks' },
        '--staged-only': { key: 'stagedOnly' },
    },
    values: {
        '--scope': { key: 'scope' },
    },
})

// ─── Git 工具函数 ─────────────────────────────────────────────────────────────

function safeExec(command) {
    try {
        return execSync(command, { cwd: repoRoot, encoding: 'utf8' }).trim()
    } catch {
        return ''
    }
}

function getChangedFiles() {
    const staged = safeExec('git diff --cached --name-only')
    const unstaged = stagedOnly ? '' : safeExec('git diff --name-only')
    const untracked = stagedOnly ? '' : safeExec('git ls-files --others --exclude-standard')

    const allFiles = [
        ...staged.split('\n'),
        ...unstaged.split('\n'),
        ...untracked.split('\n'),
    ]
        .map((f) => f.trim())
        .filter(Boolean)

    return [...new Set(allFiles)]
}

function getCurrentBranch() {
    return safeExec('git rev-parse --abbrev-ref HEAD') || 'unknown'
}

function getLatestCommit() {
    return safeExec('git log -1 --oneline') || '(no commits)'
}

function getStagedFiles() {
    return safeExec('git diff --cached --name-only')
        .split('\n')
        .map((f) => f.trim())
        .filter(Boolean)
}

// ─── 改动类型检测 ─────────────────────────────────────────────────────────────

/**
 * 根据文件列表推断本次改动命中的类型集合。
 * 返回 Set<ChangeType>
 */
function detectChangeTypes(files) {
    const types = new Set()

    const patterns = {
        docs: (f) =>
            /\.(md|mdx)$/.test(f)
            || /^docs\//.test(f)
            || /^README/.test(f)
            || /^CHANGELOG/.test(f)
            || /^CONTRIBUTING/.test(f)
            || /^CODE_OF_CONDUCT/.test(f)
            || /^SECURITY/.test(f),
        governance: (f) =>
            /^(AGENTS|CLAUDE)\.md$/.test(f)
            || /^\.(github|claude)\/(agents|skills)\//.test(f)
            || /^docs\/standards\//.test(f),
        config: (f) =>
            /\.(json|yaml|yml|toml|env|mjs|cjs|js|ts)$/.test(f)
            && !/^(app|error|components|composables|pages|layouts|server|lib|utils|types|middleware|plugins|styles)\//.test(f),
        script: (f) => /^scripts\//.test(f),
        style: (f) => /\.(css|scss|sass)$/.test(f),
        ui: (f) =>
            /\.(vue)$/.test(f)
            && (/^(components|pages|layouts)\//.test(f) || /^(app|error)\.vue$/.test(f)),
        logic: (f) =>
            /\.(ts|js)$/.test(f)
            && /^(composables|utils|lib|middleware|plugins)\//.test(f),
        api: (f) => /^server\//.test(f),
        test: (f) => /\.(test|spec)\.(ts|js)$/.test(f) || /^tests\//.test(f),
    }

    for (const file of files) {
        for (const [type, check] of Object.entries(patterns)) {
            if (check(file)) {
                types.add(type)
            }
        }
    }

    return types
}

/**
 * 根据改动类型确定最低验证层级与建议命令
 */
function resolveValidationLevel(types) {
    // 按最高层级升级
    let level = 'V0'
    const commands = new Set()
    const notes = []

    if (types.has('docs') && !types.has('ui') && !types.has('api') && !types.has('logic') && !types.has('config') && !types.has('script')) {
        level = 'V1'
        commands.add('pnpm lint:md')
        notes.push('文档/README/翻译类: V0 + V1 + RG')
    }

    if (types.has('governance')) {
        level = 'V1'
        commands.add('pnpm lint:md')
        commands.add('pnpm ai:check')
        notes.push('governance/skill/agent 类: V0 + V1 + RG，需额外 pnpm ai:check')
    }

    if (types.has('style')) {
        level = compareLevel(level, 'V1')
        commands.add('pnpm lint:css')
        notes.push('样式类: V0 + V1 + (V3) + RG')
    }

    if (types.has('config') || types.has('script')) {
        level = compareLevel(level, 'V2')
        commands.add('pnpm lint')
        commands.add('pnpm typecheck')
        notes.push('配置/脚本类: V0 + V1 + 按影响补 V2 + RG，需脚本实际运行验证')
    }

    if (types.has('logic')) {
        level = compareLevel(level, 'V2')
        commands.add('pnpm lint')
        commands.add('pnpm typecheck')
        notes.push('逻辑/工具函数/服务层: V0 + V1 + V2 + RG，需补定向测试')
    }

    if (types.has('api')) {
        level = compareLevel(level, 'V2')
        commands.add('pnpm lint')
        commands.add('pnpm typecheck')
        notes.push('API/鉴权/数据写入: V0 + V1 + V2 + RG，关键链路升 V3')
    }

    if (types.has('ui')) {
        level = compareLevel(level, 'V3')
        commands.add('pnpm lint')
        commands.add('pnpm typecheck')
        notes.push('UI组件/页面交互: V0 + V1 + V2 + V3 + RG，需浏览器验证')
    }

    if (types.has('test')) {
        commands.add('pnpm lint')
        commands.add('pnpm typecheck')
        notes.push('测试文件改动: 需 lint + typecheck，测试代码本身也需审计')
    }

    if (commands.size === 0) {
        commands.add('pnpm lint')
        commands.add('pnpm typecheck')
    }

    return { level, commands: [...commands], notes }
}

const LEVEL_RANK = { V0: 0, V1: 1, V2: 2, V3: 3, V4: 4 }
function compareLevel(a, b) {
    return LEVEL_RANK[a] >= LEVEL_RANK[b] ? a : b
}

// ─── 命令运行 ─────────────────────────────────────────────────────────────────

function runCommand(command, commandArgs) {
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

        child.stdout.on('data', (d) => {
            process.stdout.write(d)
            chunks.push(d)
        })
        child.stderr.on('data', (d) => {
            process.stderr.write(d)
            chunks.push(d)
        })

        child.on('error', (err) =>
            resolve({ ok: false, durationMs: Date.now() - start, output: err.message }),
        )
        child.on('exit', (code) =>
            resolve({
                ok: code === 0,
                durationMs: Date.now() - start,
                output: Buffer.concat(chunks).toString('utf8').trim(),
            }),
        )
    })
}

// ─── 主流程 ───────────────────────────────────────────────────────────────────

const dateStr = new Date().toISOString().slice(0, 10)
const branch = getCurrentBranch()
const scope = scopeArg ?? branch.replace(/\//g, '-').replace(/[^a-zA-Z0-9-]/g, '')
const latestCommit = getLatestCommit()
const changedFiles = getChangedFiles()
const stagedFiles = getStagedFiles()

console.info(`\n${'─'.repeat(60)}`)
console.info('  墨梅博客 - Review Gate 证据生成')
console.info(`  分支: ${branch}  |  scope: ${scope}`)
console.info(`  变更文件数: ${changedFiles.length}  |  暂存文件数: ${stagedFiles.length}`)
console.info(`${'─'.repeat(60)}\n`)

const types = detectChangeTypes(changedFiles)
const { level, commands, notes } = resolveValidationLevel(types)

console.info(`  检测到改动类型: ${[...types].join(', ') || '(未知)'}`)
console.info(`  最低验证层级: ${level}`)
console.info(`  建议执行命令: ${commands.join(', ')}`)
console.info()

// 运行静态检查（可选）
const checkResults = []
if (runChecks) {
    console.info('  执行静态检查...\n')
    for (const cmd of commands) {
        const [bin, ...rest] = cmd.split(' ')
        console.info(`▶ ${cmd}`)
        const result = await runCommand(bin, rest)
        checkResults.push({ command: cmd, ...result })
        const status = result.ok ? '✓ PASS' : '✗ FAIL'
        console.info(`  ${status}  ${cmd}  (${(result.durationMs / 1000).toFixed(1)}s)\n`)
    }
}

// ─── 证据文件生成 ─────────────────────────────────────────────────────────────

const artifactDir = path.join(repoRoot, 'artifacts', 'review-gate')
const artifactPath = path.join(artifactDir, `${dateStr}-${scope}.md`)

const lines = [
    `# Review Gate Record`,
    '',
    `- 范围: ${scope}`,
    `- 关联 Todo: (请填写对应 Todo 条目)`,
    `- 改动类型: ${[...types].join(', ') || '(请手动标注)'}`,
    `- 风险等级: (请填写: 低 / 中 / 高)`,
    `- 记录路径: ${path.relative(repoRoot, artifactPath)}`,
    `- 生成时间: ${new Date().toISOString()}`,
    `- 最新提交: ${latestCommit}`,
    '',
    '## Round 1',
    '',
    '### 变更范围',
    '- 文件清单:',
]

// 最多列出 30 个文件
const displayFiles = changedFiles.slice(0, 30)
for (const f of displayFiles) {
    lines.push(`  - ${f}`)
}
if (changedFiles.length > 30) {
    lines.push(`  - ... 及其他 ${changedFiles.length - 30} 个文件`)
}

lines.push('- 关键入口: (请手动标注高风险变更入口)')
lines.push('')
lines.push('### 最低验证要求')
lines.push(`- 目标层级: ${level} + RG`)
lines.push(`- 需要的命令: ${commands.join(', ')}`)
if (notes.length > 0) {
    lines.push('- 层级依据:')
    for (const note of notes) {
        lines.push(`  - ${note}`)
    }
}
lines.push('')
lines.push('### 已执行验证')

if (checkResults.length > 0) {
    for (const r of checkResults) {
        lines.push(`- **${r.command}**: ${r.ok ? 'PASS ✓' : 'FAIL ✗'}  (${(r.durationMs / 1000).toFixed(1)}s)`)
    }
} else {
    for (const cmd of commands) {
        lines.push(`- ${cmd}: (请填写执行结果)`)
    }
    lines.push('- 浏览器验证 / E2E: (如适用，请填写)')
}

const blockers = runChecks ? checkResults.filter((r) => !r.ok) : []

lines.push('')
lines.push('### Findings')
lines.push('#### blocker')
if (blockers.length > 0) {
    blockers.forEach((r, i) => {
        lines.push(`${i + 1}. RG-B${String(i + 1).padStart(2, '0')} ${r.command} 校验失败`)
        lines.push('   - 位置: 见命令输出')
        lines.push('   - 风险: 需修复后方可放行')
        lines.push('   - 修复方向: (请填写)')
    })
} else {
    lines.push('(暂无 / 请在 review 后填写)')
}
lines.push('#### warning')
lines.push('(暂无 / 请在 review 后填写)')
lines.push('#### suggest')
lines.push('(暂无 / 请在 review 后填写)')
lines.push('')
lines.push('### Review Gate')

const hasBlockers = blockers.length > 0
lines.push(`- 结论: ${hasBlockers ? 'Reject' : '(Pass / Reject — 请在校验完成后填写)'}`)
lines.push(`- 失败原因或通过条件: ${hasBlockers ? `${blockers.map((r) => r.command).join(', ')} 失败` : '(请填写)'}`)
lines.push('- 本轮新增问题: 0')
lines.push('- 本轮已关闭问题: 0')
lines.push('- 待复查问题: 0')
lines.push('')
lines.push('### 未覆盖边界')
lines.push('- (请填写未执行的验证层级与原因)')
lines.push('')
lines.push('### 后续补跑计划')
lines.push('- (请填写剩余风险与后续补跑计划)')
lines.push('')
lines.push('---')
lines.push('*本文件由 `scripts/review-gate/generate-evidence.mjs` 自动生成，请在执行验证后手动补全结论。*')
lines.push('')

try {
    await mkdir(artifactDir, { recursive: true })
    await writeFile(artifactPath, lines.join('\n'), 'utf8')
    console.info(`  证据文件已生成: ${path.relative(repoRoot, artifactPath)}`)
} catch (error) {
    console.error(`  [generate-evidence] 文件写入失败: ${error.message}`)
    process.exit(1)
}

const hasFailures = runChecks && blockers.length > 0
console.info(`\n${'─'.repeat(60)}`)
console.info(`  改动类型: ${[...types].join(', ') || '(未检测到)'}`)
console.info(`  验证层级: ${level} + RG`)
console.info(`  检查结果: ${runChecks ? `通过 ${checkResults.filter((r) => r.ok).length} / 失败 ${blockers.length}` : '(未执行，使用 --run-checks 启用)'}`)
console.info(`  证据文件: artifacts/review-gate/${dateStr}-${scope}.md`)
console.info(`${'─'.repeat(60)}\n`)

if (hasFailures) {
    process.exit(1)
}
