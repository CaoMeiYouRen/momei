#!/usr/bin/env node
/**
 * 文档事实源一致性检查脚本
 *
 * 检查文档层级是否遵循 AGENTS.md 定义的权威层级：
 * - L0: AGENTS.md
 * - L1: docs/standards/*.md
 * - L2: docs/design/*.md
 * - L3: CLAUDE.md / 平台适配文件
 *
 * 翻译 freshness 语义（自 2026-08 调整）：
 * - Blocker：源文档自翻译 last_sync 时点以来在 git 中有提交（"源变了"）。
 * - Soft warning：源未变但 last_sync 超过 tier 的 maxAge 软上限（仅提示，不阻断）。
 * - last_sync 缺失 / 无法定位源 / 源缺失：error。
 *
 * 之所以用 git 提交而不是 mtime：
 *   - mtime 会被 checkout / touch / CI 行为触碰，造成 false positive；
 *   - mtime 不能区分"实质内容变更"和"无意义的时间戳变化"；
 *   - "检测原文件是否更改"的可靠信号是 git 提交历史。
 *
 * 约束规则：
 * 1. 低层级文档不得重复高层级已定义的规则
 * 2. CLAUDE.md 不应包含层级定义（如 L0, L1 等）
 * 3. docs/standards/documentation.md 必须包含"事实源收敛"相关章节
 */

import fs from 'fs'
import path from 'path'
import process from 'node:process'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'url'
import { isDirectExecution, parseCliOptions } from '../shared/cli.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
export const ROOT = path.resolve(__dirname, '../..')
export const DEFAULT_PROFILE = 'default'
export const DEFAULT_MODE = 'error'

// 检查规则定义
export const RULES = [
    {
        file: 'CLAUDE.md',
        maxAge: 90, // 天
        check: (content) => {
            // CLAUDE.md 不应定义层级
            if (content.includes('L0') || content.includes('L1') || content.includes('L2') || content.includes('L3')) {
                return { pass: false, reason: 'CLAUDE.md 不应包含层级定义（L0/L1/L2/L3）' }
            }
            // CLAUDE.md 不应重复 AGENTS.md 的详细内容
            // 允许在表格中引用 PDTFC+，只要不是定义性描述
            // 排除条件：表格行（包含 | 符号）中的引用
            const lines = content.split('\n')
            for (const line of lines) {
                // 跳过表格行
                if (line.includes('|') && line.trim().startsWith('|')) {
                    continue
                }
                // 跳过标题和链接引用行
                if (line.startsWith('#') || line.startsWith('-') || line.startsWith('*')) {
                    continue
                }
                // 检查是否有 PDTFC+ 定义性描述（而非引用）
                if (line.includes('PDTFC+') && (line.includes('是') || line.includes('定义') || line.includes('指'))) {
                    return { pass: false, reason: 'CLAUDE.md 不应定义 PDTFC+，应引用 AGENTS.md' }
                }
            }
            return { pass: true }
        },
    },
    {
        file: 'docs/standards/documentation.md',
        mustContain: ['事实源', 'Source of Truth', '收敛'],
        check: (content) => {
            const hasConvergence = RULES[1].mustContain.some((term) => content.includes(term))
            if (!hasConvergence) {
                return {
                    pass: false,
                    reason: `docs/standards/documentation.md 必须包含"事实源收敛"相关章节，需包含以下之一：${RULES[1].mustContain.join('、')}`,
                }
            }
            return { pass: true }
        },
    },
]

export const TRANSLATION_LOCALES = ['en-US', 'zh-TW', 'ko-KR', 'ja-JP']

/**
 * 每个 tier 的 freshness 软上限（天）。
 *
 * 自 2026-08 起，时效判定由"硬上限"改为"软上限"（仅作为 warning 信号）。
 * Blocker 仅在源文档 git 中自 last_sync 以来有提交时触发；开发频率降低后，
 * 不再因 last_sync 自然过期阻断 CI。详见 docs/standards/documentation.md § 4.3.1。
 */
export const TRANSLATION_TIER_RULES = {
    'must-sync': { maxAge: 60 },
    'summary-sync': { maxAge: 120 },
    'source-only': { maxAge: null },
}

/**
 * candidate profile 保留旧的更紧凑阈值，用于评估收紧效果。
 * candidate 不阻断 release gate，但会输出 warning baseline。
 */
export const SOURCE_OF_TRUTH_PROFILES = {
    candidate: {
        translationTierRules: {
            'must-sync': { maxAge: 21 },
            'summary-sync': { maxAge: 30 },
            'source-only': { maxAge: null },
        },
    },
    default: {
        translationTierRules: { ...TRANSLATION_TIER_RULES },
    },
}

/**
 * docs/i18n/<locale>/ 与 docs/ 的目录镜像约定。
 * 用于自动推导 source_origin（fallback 第 3 层）。
 */
export const TRANSLATION_DIR_CONVENTION = /^docs\/i18n\/([^/]+)\//

export function parseArgs(argv = process.argv) {
    return parseCliOptions(argv, {
        defaults: {
            mode: DEFAULT_MODE,
            profile: DEFAULT_PROFILE,
        },
        values: {
            '--mode': {
                allowedValues: ['error', 'warn'],
                key: 'mode',
            },
            '--profile': {
                allowedValues: Object.keys(SOURCE_OF_TRUTH_PROFILES),
                key: 'profile',
            },
        },
    })
}

function readFile(filePath, root = ROOT) {
    try {
        return fs.readFileSync(path.join(root, filePath), 'utf-8')
    } catch {
        return null
    }
}

// alias 用于让 checkTranslatedDocs 的 root 参数在内部就显式传
const readFileWithRoot = readFile

function normalizePath(filePath) {
    return filePath.replace(/\\/g, '/')
}

function parseFrontmatter(content) {
    const match = content.match(/^---\n([\s\S]*?)\n---/)
    if (!match) {
        return {}
    }

    const data = {}
    for (const line of match[1].split('\n')) {
        const fieldMatch = line.match(/^([A-Za-z0-9_-]+):\s*(.+)$/)
        if (!fieldMatch) {
            continue
        }

        const [, key, rawValue] = fieldMatch
        data[key] = rawValue.trim().replace(/^['"]|['"]$/g, '')
    }

    return data
}

// 仅暴露给单测；不影响 CLI 行为。
export { parseFrontmatter }

function resolveTranslationTier(filePath) {
    const normalized = normalizePath(filePath)
    const match = normalized.match(/^docs\/i18n\/([^/]+)\/(.+)$/)

    if (!match) {
        return null
    }

    const [, locale, relativePath] = match

    if (locale === 'en-US') {
        if (['index.md', 'guide/quick-start.md', 'guide/deploy.md', 'guide/translation-governance.md'].includes(relativePath)) {
            return 'must-sync'
        }

        if ([
            'plan/roadmap.md',
            'guide/development.md',
            'guide/features.md',
            'guide/variables.md',
            'guide/enhanced-pack.md',
            'standards/planning.md',
            'standards/documentation.md',
            'standards/security.md',
            'standards/testing.md',
            'standards/development.md',
            'standards/ai-collaboration.md',
        ].includes(relativePath)) {
            return 'summary-sync'
        }

        if (relativePath.startsWith('design/') || ['guide/ai-development.md', 'guide/comparison.md', 'standards/api.md'].includes(relativePath)) {
            return 'source-only'
        }
    }

    if (locale === 'zh-TW' || locale === 'ko-KR') {
        if ([
            'index.md',
            'guide/quick-start.md',
            'guide/deploy.md',
            'guide/translation-governance.md',
            'guide/features.md',
            'guide/variables.md',
            'guide/enhanced-pack.md',
            'plan/roadmap.md',
        ].includes(relativePath)) {
            return 'summary-sync'
        }

        if (relativePath.startsWith('design/') || relativePath.startsWith('standards/') || ['guide/development.md', 'guide/ai-development.md', 'guide/comparison.md'].includes(relativePath)) {
            return 'source-only'
        }
    }

    if (locale === 'ja-JP') {
        if (['index.md', 'guide/quick-start.md', 'guide/deploy.md', 'guide/translation-governance.md', 'guide/enhanced-pack.md', 'guide/features.md', 'guide/variables.md', 'plan/roadmap.md'].includes(relativePath)) {
            return 'summary-sync'
        }
    }

    return null
}

function getFrontmatterDate(content) {
    const match = content.match(/last_sync:\s*(\d{4}-\d{2}-\d{2})/)
    if (match) {
        return new Date(match[1])
    }
    return null
}

// 仅暴露给单测；不影响 CLI 行为。
export { getFrontmatterDate }

function daysSince(date, now = new Date()) {
    const diff = now.getTime() - date.getTime()
    return Math.floor(diff / (1000 * 60 * 60 * 24))
}

function toIsoDate(date) {
    if (!date) {
        return null
    }
    if (date instanceof Date) {
        return date.toISOString().slice(0, 10)
    }
    const parsed = new Date(date)
    if (Number.isNaN(parsed.getTime())) {
        return null
    }
    return parsed.toISOString().slice(0, 10)
}

function fileExists(absolutePath) {
    try {
        return fs.statSync(absolutePath).isFile()
    } catch {
        return false
    }
}

function checkFile(filePath, rule) {
    const content = readFile(filePath)
    if (!content) {
        return { pass: false, reason: `文件不存在: ${filePath}` }
    }

    // 基本检查
    const result = rule.check(content)
    if (!result.pass) {
        return result
    }

    // 如果有 maxAge 检查文件修改时间
    if (rule.maxAge) {
        const stats = fs.statSync(path.join(ROOT, filePath))
        const age = daysSince(stats.mtime)
        if (age > rule.maxAge) {
            return {
                pass: false,
                reason: `${filePath} 已超过 ${rule.maxAge} 天未更新（当前：${age} 天）`,
            }
        }
    }

    return { pass: true }
}

/**
 * 三层 fallback 解析翻译文件对应的源文档路径：
 *   1. frontmatter.source_origin（显式声明）
 *   2. 正文 "original Chinese version" 后第一个相对路径
 *   3. 目录约定 docs/i18n/<locale>/<path> ⇄ docs/<path>
 *
 * 返回仓库根相对路径（统一正斜杠）或 null。
 */
export function resolveSourceOrigin(translationFilePath, content, frontmatter = {}) {
    if (frontmatter.source_origin) {
        return normalizePath(frontmatter.source_origin)
    }

    if (content) {
        // 匹配正文里指回中文原文的相对链接；兼容多种锚文本写法。
        // 例：...see the [Chinese version](../../../guide/deploy.md)
        //    ...the [original Chinese version](../../../guide/deploy.md)...
        const linkMatch = content.match(/\[[^\]]*(?:Chinese version|原始中文|中文原文|中文版本)[^\]]*\]\(([^)]+)\)/)
        if (linkMatch) {
            const raw = linkMatch[1].split('#')[0].split(' ')[0].trim()
            if (raw && !raw.startsWith('http') && !raw.startsWith('mailto:')) {
                // 正文里的相对路径是相对于当前翻译文件所在目录的；
                // 需要相对于仓库根解析（translationFilePath 是仓库根相对路径）。
                const absoluteFromRoot = path.resolve(
                    path.dirname(path.join(ROOT, translationFilePath)),
                    raw,
                )
                const repoRelative = path.relative(ROOT, absoluteFromRoot)
                const normalized = normalizePath(repoRelative)
                if (normalized && !normalized.startsWith('..')) {
                    return normalized
                }
            }
        }
    }

    const dirMatch = translationFilePath.match(TRANSLATION_DIR_CONVENTION)
    if (dirMatch) {
        const relativePath = translationFilePath.slice(dirMatch[0].length)
        return normalizePath(`docs/${relativePath}`)
    }

    return null
}

/**
 * 用 git 历史判定"自 last_sync 以来，源是否被改过"。
 *
 * 实现要点：
 * - `git log --since` 是 inclusive：last_sync 当天的 commit 会被算进来，
 *   这在"commit 时间与 last_sync 日期同时区、同日"时会造成 false positive。
 * - 解决：拉取 author date (`%aI`) 后在 Node 端做字典序比较（ISO 日期字符串正好字典序 = 时序）。
 *   当 commit 日期严格大于 last_sync 日期时，才计入"源有改动"。
 *
 * 返回提交数（number）；git 查询失败 / 参数无效时返回 null。
 * root 参数允许测试注入临时仓库根（默认走模块常量 ROOT）。
 */
export function getSourceCommitCountSince(sourcePath, lastSyncIso, root = ROOT) {
    if (!sourcePath || !lastSyncIso) {
        return null
    }
    try {
        const out = execSync(
            `git log --format="%aI" -- ${JSON.stringify(sourcePath)}`,
            { cwd: root, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] },
        )
        let count = 0
        for (const line of out.split('\n')) {
            const isoDate = line.slice(0, 10)
            // 严格大于 last_sync 日期才算有改动；同日不算
            if (isoDate && isoDate > lastSyncIso) {
                count++
            }
        }
        return count
    } catch {
        return null
    }
}

/**
 * 纯函数：判定翻译文件时效状态。
 * 返回 { severity: 'pass' | 'warning' | 'error', reason }
 *
 * 判定优先级：
 *   1. last_sync 缺失 -> 'error'
 *   2. sourceCommitCountSinceLastSync === null（git 不可用 / 源缺失）-> 'warning'
 *   3. sourceCommitCountSinceLastSync > 0 -> 'error'（源自从翻译同步以来被改过）
 *   4. sourceCommitCountSinceLastSync === 0 且 now - lastSync > maxAge -> 'warning'
 *      （源未变但长期未维护；仅作为软上限提示）
 *   5. 否则 -> 'pass'
 *
 * lastSync 接受 Date | ISO 字符串 | YYYY-MM-DD；内部归一为字符串。
 * 纯函数形式便于单测；不涉及 git 与文件系统。
 *
 * @typedef {Object} DecideTranslationStatusInput
 * @property {Date|string|null|undefined} [lastSync]
 * @property {number|null|undefined} [sourceCommitCountSinceLastSync]
 * @property {number|null} [maxAge]
 * @property {Date} [now]
 */

/**
 * @param {DecideTranslationStatusInput} [input]
 */
export function decideTranslationStatus({
    lastSync,
    sourceCommitCountSinceLastSync,
    maxAge = null,
    now = new Date(),
} = {}) {
    const lastSyncIso = toIsoDate(lastSync)
    if (!lastSyncIso) {
        return { severity: 'error', reason: '翻译文档缺少 last_sync 元数据' }
    }

    if (sourceCommitCountSinceLastSync === null || sourceCommitCountSinceLastSync === undefined) {
        return { severity: 'warning', reason: '无法访问源文档的 git 历史，跳过硬判定' }
    }

    if (sourceCommitCountSinceLastSync > 0) {
        return {
            severity: 'error',
            reason: `自上次同步（${lastSyncIso}）以来源已发生 ${sourceCommitCountSinceLastSync} 次提交，需要重新同步`,
        }
    }

    if (typeof maxAge === 'number') {
        const age = daysSince(new Date(lastSyncIso), now)
        if (age > maxAge) {
            return {
                severity: 'warning',
                reason: `源未变但翻译已 ${age} 天未维护（${maxAge} 天软上限，仅 warning）`,
            }
        }
    }

    return { severity: 'pass' }
}

/**
 * 把 severity 归一化为布尔 pass：severity === 'pass' 时 pass 为真。
 * 仅为兼容旧 contract（pass: boolean）；新代码应直接使用 severity 字段。
 */
function severityToPass(severity) {
    return severity === 'pass'
}

export function checkTranslatedDocs(options = {}) {
    const {
        translationTierRules = TRANSLATION_TIER_RULES,
        root = ROOT,
    } = options

    const results = []

    for (const locale of TRANSLATION_LOCALES) {
        const dir = `docs/i18n/${locale}/`
        const fullPath = path.join(root, dir)
        if (!fs.existsSync(fullPath)) {
            continue
        }

        const files = fs.readdirSync(fullPath, { recursive: true })
            .filter((f) => f.endsWith('.md'))

        for (const file of files) {
            const filePath = normalizePath(path.join(dir, file))
            const content = readFileWithRoot(filePath, root)
            if (!content) {
                continue
            }

            const tier = resolveTranslationTier(filePath)
            if (!tier) {
                results.push({
                    file: filePath,
                    pass: false,
                    severity: 'error',
                    reason: `翻译文档未映射到 freshness tier，请更新治理矩阵或目录范围: ${filePath}`,
                })
                continue
            }

            const frontmatter = parseFrontmatter(content)
            const lastSyncDate = getFrontmatterDate(content)
            const lastSyncIso = toIsoDate(lastSyncDate)

            // frontmatter translation_tier 与治理矩阵不一致（仅在 frontmatter 显式声明时检查）
            if (frontmatter.translation_tier && frontmatter.translation_tier !== tier) {
                results.push({
                    file: filePath,
                    pass: false,
                    severity: 'error',
                    reason: `翻译文档的 translation_tier 与当前治理矩阵不一致（期望 ${tier}）: ${filePath}`,
                })
            }

            if (tier === 'source-only') {
                if (frontmatter.translation_tier !== 'source-only') {
                    results.push({
                        file: filePath,
                        pass: false,
                        severity: 'error',
                        reason: `source-only 页面必须显式声明 translation_tier: source-only: ${filePath}`,
                    })
                }

                if (!frontmatter.source_origin) {
                    results.push({
                        file: filePath,
                        pass: false,
                        severity: 'error',
                        reason: `source-only 页面必须提供 source_origin 回链: ${filePath}`,
                    })
                }

                continue
            }

            const maxAge = translationTierRules[tier]?.maxAge ?? null
            const sourcePath = resolveSourceOrigin(filePath, content, frontmatter)

            if (!lastSyncIso) {
                results.push({
                    file: filePath,
                    pass: false,
                    severity: 'error',
                    reason: `翻译文档缺少 last_sync 元数据: ${filePath}`,
                })
                continue
            }

            if (!sourcePath) {
                results.push({
                    file: filePath,
                    pass: false,
                    severity: 'error',
                    reason: `翻译文档无法定位源文档（缺少 source_origin / 正文回链 / 目录约定）: ${filePath}`,
                })
                continue
            }

            if (!fileExists(path.join(root, sourcePath))) {
                results.push({
                    file: filePath,
                    pass: false,
                    severity: 'error',
                    reason: `翻译文档声明的源文档不存在（${sourcePath}）: ${filePath}`,
                })
                continue
            }

            const sourceCommitCountSinceLastSync = getSourceCommitCountSince(sourcePath, lastSyncIso, root)

            const decision = decideTranslationStatus({
                lastSync: lastSyncIso,
                sourceCommitCountSinceLastSync,
                maxAge,
            })

            if (decision.severity === 'pass') {
                continue
            }

            const entry = {
                file: filePath,
                severity: decision.severity,
                reason: decision.reason,
                sourcePath,
                tier,
                maxAge,
                sourceCommitCountSinceLastSync,
                pass: severityToPass(decision.severity),
                age: daysSince(new Date(lastSyncIso)),
                lastSync: lastSyncIso,
            }

            results.push(entry)
        }
    }

    return results
}

export function collectSourceOfTruthReport(options = {}) {
    const profile = options.profile ?? DEFAULT_PROFILE
    const root = options.root ?? ROOT
    const profileConfig = SOURCE_OF_TRUTH_PROFILES[profile] ?? SOURCE_OF_TRUTH_PROFILES.default
    const baseRuleResults = RULES.map((rule) => ({
        file: rule.file,
        ...checkFile(rule.file, rule),
    }))
    const translationResults = checkTranslatedDocs({
        translationTierRules: profileConfig.translationTierRules,
        root,
    })

    const hasErrors = baseRuleResults.some((result) => !result.pass)
        || translationResults.some((result) => result.severity === 'error')
    const hasWarnings = translationResults.some((result) => result.severity === 'warning')

    return {
        baseRuleResults,
        hasErrors,
        hasWarnings,
        profile,
        translationResults,
        translationTierRules: profileConfig.translationTierRules,
    }
}

function iconFor(severity) {
    if (severity === 'error') {
        return '❌'
    }
    if (severity === 'warning') {
        return '⚠️ '
    }
    return '✅'
}

export function printSourceOfTruthReport(report, mode = DEFAULT_MODE) {
    console.info('🔍 开始文档事实源一致性检查...\n')

    for (const result of report.baseRuleResults) {
        const status = result.pass ? '✅' : '❌'
        console.info(`${status} ${result.file}`)
        if (!result.pass) {
            console.error(`   └─ ${result.reason}`)
        }
    }

    console.info('\n📚 翻译文档时效性检查:')
    if (report.translationResults.length === 0) {
        console.info('✅ 所有翻译文档均通过（源未变或已跟进同步）')
    } else {
        for (const result of report.translationResults) {
            // mode === 'warn' 时把 error 降级为 warning 呈现，但 hasErrors 不变（按 mode 决定 exit）
            const effectiveSeverity = mode === 'warn' && result.severity === 'error'
                ? 'warning'
                : result.severity
            const writer = effectiveSeverity === 'error' ? console.error : console.warn
            writer(`${iconFor(effectiveSeverity)} ${result.file}`)
            writer(`   └─ ${result.reason}`)
        }
    }

    // soft warning（仅长期未维护）单独展示：CI 通过但提示治理
    if (mode === 'error' && report.hasWarnings && !report.hasErrors) {
        console.info(`\n${'─'.repeat(50)}`)
        console.info('ℹ️  soft warning（不阻断）：翻译文档长期未维护，请关注但不强制同步')
    }

    console.info(`\n${'='.repeat(50)}`)
    if (report.hasErrors) {
        if (mode === 'error') {
            console.error('❌ 检查未通过：发现事实源一致性问题')
        } else {
            console.warn('⚠️ 候选 profile 发现事实源一致性问题，当前仅作为 warning baseline 输出')
        }
        return
    }

    console.info('✅ 所有检查通过：文档事实源层级正确')
}

export function main(argv = process.argv) {
    const { mode, profile } = parseArgs(argv)
    const report = collectSourceOfTruthReport({ profile })

    printSourceOfTruthReport(report, mode)

    if (report.hasErrors && mode === 'error') {
        process.exit(1)
    }
}

if (isDirectExecution(import.meta.url)) {
    main()
}
