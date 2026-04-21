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
 * 约束规则：
 * 1. 低层级文档不得重复高层级已定义的规则
 * 2. CLAUDE.md 不应包含层级定义（如 L0, L1 等）
 * 3. docs/standards/documentation.md 必须包含"事实源收敛"相关章节
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, '../..')

// 检查规则定义
const RULES = [
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

const TRANSLATION_LOCALES = ['en-US', 'zh-TW', 'ko-KR', 'ja-JP']

const TRANSLATION_TIER_RULES = {
    'must-sync': { maxAge: 30 },
    'summary-sync': { maxAge: 45 },
    'source-only': { maxAge: null },
}

function readFile(filePath) {
    try {
        return fs.readFileSync(path.join(ROOT, filePath), 'utf-8')
    } catch {
        return null
    }
}

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
            'plan/roadmap.md',
        ].includes(relativePath)) {
            return 'summary-sync'
        }

        if (relativePath.startsWith('design/') || relativePath.startsWith('standards/') || ['guide/development.md', 'guide/ai-development.md', 'guide/comparison.md'].includes(relativePath)) {
            return 'source-only'
        }
    }

    if (locale === 'ja-JP') {
        if (['index.md', 'guide/quick-start.md', 'guide/deploy.md', 'guide/translation-governance.md', 'plan/roadmap.md'].includes(relativePath)) {
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

function daysSince(date) {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    return Math.floor(diff / (1000 * 60 * 60 * 24))
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

function checkTranslatedDocs() {
    const results = []

    for (const locale of TRANSLATION_LOCALES) {
        const dir = `docs/i18n/${locale}/`
        const fullPath = path.join(ROOT, dir)
        if (!fs.existsSync(fullPath)) {
            continue
        }

        const files = fs.readdirSync(fullPath, { recursive: true })
            .filter((f) => f.endsWith('.md'))

        for (const file of files) {
            const filePath = normalizePath(path.join(dir, file))
            const content = readFile(filePath)
            if (!content) {
                continue
            }

            const tier = resolveTranslationTier(filePath)
            if (!tier) {
                results.push({
                    file: filePath,
                    pass: false,
                    reason: `翻译文档未映射到 freshness tier，请更新治理矩阵或目录范围: ${filePath}`,
                })
                continue
            }

            const frontmatter = parseFrontmatter(content)

            const lastSync = getFrontmatterDate(content)

            if (!lastSync) {
                results.push({
                    file: filePath,
                    pass: false,
                    reason: `翻译文档缺少 last_sync 元数据: ${filePath}`,
                })
                continue
            }

            if (tier === 'source-only') {
                if (frontmatter.translation_tier !== 'source-only') {
                    results.push({
                        file: filePath,
                        pass: false,
                        reason: `source-only 页面必须显式声明 translation_tier: source-only: ${filePath}`,
                    })
                }

                if (!frontmatter.source_origin) {
                    results.push({
                        file: filePath,
                        pass: false,
                        reason: `source-only 页面必须提供 source_origin 回链: ${filePath}`,
                    })
                }

                continue
            }

            if (frontmatter.translation_tier && frontmatter.translation_tier !== tier) {
                results.push({
                    file: filePath,
                    pass: false,
                    reason: `翻译文档的 translation_tier 与当前治理矩阵不一致（期望 ${tier}）: ${filePath}`,
                })
            }

            const maxAge = TRANSLATION_TIER_RULES[tier].maxAge
            const age = daysSince(lastSync)
            if (typeof maxAge === 'number' && age > maxAge) {
                results.push({
                    file: filePath,
                    age,
                    maxAge,
                    pass: false,
                    reason: `翻译文档已 ${age} 天未同步（${tier} 限制：${maxAge} 天）`,
                })
            }
        }
    }

    return results
}

// 主检查流程
console.info('🔍 开始文档事实源一致性检查...\n')

let hasErrors = false

// 检查基础规则
for (const rule of RULES) {
    const result = checkFile(rule.file, rule)
    const status = result.pass ? '✅' : '❌'
    console.info(`${status} ${rule.file}`)
    if (!result.pass) {
        console.error(`   └─ ${result.reason}`)
        hasErrors = true
    }
}

// 检查翻译文档
console.info('\n📚 翻译文档时效性检查:')
const translationResults = checkTranslatedDocs()
if (translationResults.length === 0) {
    console.info('✅ 所有翻译文档均在时效范围内')
} else {
    hasErrors = true
    for (const result of translationResults) {
        console.error(`❌ ${result.file}`)
        console.error(`   └─ ${result.reason}`)
    }
}

// 总结
console.info(`\n${'='.repeat(50)}`)
if (hasErrors) {
    console.error('❌ 检查未通过：发现事实源一致性问题')
    process.exit(1)
} else {
    console.info('✅ 所有检查通过：文档事实源层级正确')
    process.exit(0)
}
