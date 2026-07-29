#!/usr/bin/env node

/**
 * Session Wisdom 蒸馏辅助脚本
 *
 * 读取 .session/wisdom.md，输出结构化分析报告：
 * - 按日期分组的条目清单
 * - 每条的类型标签、内容预览
 * - 推荐迁移目标
 * - 统计摘要
 *
 * 用法:
 *   node scripts/ai-hooks/distill-wisdom.mjs
 *
 * 可选 flags:
 *   --report      : 生成蒸馏报告到 artifacts/  (默认输出到控制台)
 *   --check       : 仅检查条目数是否超过阈值 (用于被 hook 调用)
 *   --threshold=N : 自定义阈值 (默认 20)
 *   --dry-run     : 仅分析不写文件
 */

import { readFile, writeFile, mkdir, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.resolve(__dirname, '..', '..')
const WISDOM_PATH = path.join(PROJECT_ROOT, '.session', 'wisdom.md')

// 类型 → 推荐迁移目标
const TYPE_MIGRATION_TARGETS = {
    bug: '`docs/design/governance/` 或 `docs/standards/` 对应领域的文档',
    pattern: '`docs/standards/` 对应规范文档，或 `docs/design/governance/`',
    decision: '`docs/design/modules/` 对应模块设计，或 `docs/design/governance/`',
    env: '`docs/guide/development.md`',
    test: '`docs/standards/testing.md`',
    baseline: '`docs/reports/`',
}

const TYPE_ORDER = ['bug', 'pattern', 'decision', 'env', 'test', 'baseline']

function parseWisdom(content) {
    const lines = content.split(/\r?\n/u)
    const entries = []
    let currentDate = null
    let currentLines = []

    for (const line of lines) {
        const dateMatch = line.match(/^#{2,4}\s+(\d{4}-\d{2}-\d{2})/u)

        if (dateMatch) {
            if (currentDate && currentLines.length > 0) {
                entries.push({ date: currentDate, lines: [...currentLines] })
            }

            currentDate = dateMatch[1]
            currentLines = []
            continue
        }

        if (currentDate) {
            currentLines.push(line)
        }
    }

    // 最后一组
    if (currentDate && currentLines.length > 0) {
        entries.push({ date: currentDate, lines: [...currentLines] })
    }

    return entries
}

function classifyEntry(line) {
    const trimmed = line.trim()

    if (!trimmed.startsWith('- [')) {
        return null
    }

    // 提取类型标签: [bug], [pattern], [decision], [env], [test], [baseline]
    const typeMatch = trimmed.match(/^-\s+\[(\w+)\]/u)

    if (!typeMatch) {
        return null
    }

    const type = typeMatch[1]

    // 提取内容 (去掉 prefix)
    const content = trimmed.replace(/^-\s+\[\w+\]\s+/u, '')

    // 判断是否已蒸馏 (包含 "→" 或 "→ 详见" 或 "→ 已迁移")
    const isDistilled = /→\s*(?:详见|已迁移至|`)/u.test(trimmed)

    return { type, content, line: trimmed, isDistilled }
}

async function main() {
    const args = process.argv.slice(2)
    const flags = {
        report: args.includes('--report'),
        check: args.includes('--check'),
        dryRun: args.includes('--dry-run'),
        threshold: 20,
    }

    const thresholdArg = args.find((a) => a.startsWith('--threshold='))

    if (thresholdArg) {
        flags.threshold = Number.parseInt(thresholdArg.split('=')[1], 10) || 20
    }

    // 读取 wisdom.md
    let wisdomContent

    try {
        wisdomContent = await readFile(WISDOM_PATH, 'utf8')
    } catch (err) {
        if (err.code === 'ENOENT') {
            console.error('[distill-wisdom] .session/wisdom.md 不存在，跳过')
            process.exit(0)
        }

        throw err
    }

    // 解析
    const parsed = parseWisdom(wisdomContent)
    const allEntries = []
    const activeEntries = []
    const distilledEntries = []

    for (const group of parsed) {
        for (const line of group.lines) {
            const entry = classifyEntry(line)

            if (entry) {
                allEntries.push({ ...entry, date: group.date })

                if (entry.isDistilled) {
                    distilledEntries.push({ ...entry, date: group.date })
                } else {
                    activeEntries.push({ ...entry, date: group.date })
                }
            }
        }
    }

    // --check 模式: 仅检查条目数是否超过阈值
    if (flags.check) {
        const count = activeEntries.length

        if (count >= flags.threshold) {
            console.log(`WISDOM_NEEDS_DISTILL: ${count} active entries (threshold=${flags.threshold})`)
            process.exit(0)
        }

        console.log(`WISDOM_OK: ${count} active entries (threshold=${flags.threshold})`)
        process.exit(0)
    }

    // 构造报告
    const reportParts = ['# Session Wisdom 蒸馏分析报告', '', `> 生成时间: ${new Date().toISOString().slice(0, 10)}`, '', '## 统计', '', '']

    const stats = [
        `- 总条目: ${allEntries.length}`,
        `- 活跃条目 (未蒸馏): ${activeEntries.length}`,
        `- 已蒸馏条目: ${distilledEntries.length}`,
        `- 日期跨度: ${parsed.length > 0 ? `${parsed[0].date} ~ ${parsed[parsed.length - 1].date}` : '无'}`,
    ]

    reportParts.push(...stats)
    reportParts.push('', '---', '', '## 按类型分布', '', '')

    // 按类型统计
    const typeCounts = {}

    for (const entry of activeEntries) {
        typeCounts[entry.type] = (typeCounts[entry.type] || 0) + 1
    }

    for (const entry of distilledEntries) {
        typeCounts[entry.type] = (typeCounts[entry.type] || 0) + 1
    }

    for (const type of TYPE_ORDER) {
        const count = typeCounts[type] || 0

        if (count > 0) {
            const target = TYPE_MIGRATION_TARGETS[type] || '待判断'
            reportParts.push(`- **${type}**: ${count} 条 → 推荐迁移至 ${target}`)
        }
    }

    // 其他未归类类型
    const knownTypes = new Set(TYPE_ORDER)
    const otherTypes = Object.entries(typeCounts).filter(([t]) => !knownTypes.has(t))

    for (const [type, count] of otherTypes) {
        reportParts.push(`- **${type}**: ${count} 条 → 待判断迁移目标`)
    }

    // 活跃条目详情
    reportParts.push('', '---', '', '## 活跃条目详情', '', '')

    if (activeEntries.length === 0) {
        reportParts.push('_无活跃条目_', '')
    } else {
        // 按日期分组
        let currentDate = null

        for (const entry of activeEntries) {
            if (entry.date !== currentDate) {
                reportParts.push(`### ${entry.date}`, '')
                currentDate = entry.date
            }

            const contentPreview = entry.content.length > 80
                ? `${entry.content.slice(0, 80)}…`
                : entry.content
            const target = TYPE_MIGRATION_TARGETS[entry.type] || '待判断'

            reportParts.push(`- \`[${entry.type}]\` ${contentPreview}`)
            reportParts.push(`  - 推荐迁移: ${target}`)
            reportParts.push('')
        }
    }

    // 已蒸馏条目
    if (distilledEntries.length > 0) {
        reportParts.push('---', '', '## 已蒸馏条目', '', '')

        for (const entry of distilledEntries) {
            reportParts.push(`- [${entry.date}] \`[${entry.type}]\` ${entry.content}`)
        }

        reportParts.push('')
    }

    // 阈值提示
    reportParts.push('---', '', '## 阈值提示', '', '')
    reportParts.push(`当前活跃条目: **${activeEntries.length}** / 蒸馏阈值: **${flags.threshold}**`)
    reportParts.push('')

    if (activeEntries.length >= flags.threshold) {
        reportParts.push('> ⚠️ **建议立即执行蒸馏**: 活跃条目数已达阈值')
    } else {
        reportParts.push(`> ✅ 距离下次蒸馏阈值还有 ${flags.threshold - activeEntries.length} 条`)
    }

    const report = reportParts.join('\n')

    // 输出
    if (flags.report) {
        const artifactsDir = path.join(PROJECT_ROOT, 'artifacts', 'wisdom-distill')

        await mkdir(artifactsDir, { recursive: true })
        const reportPath = path.join(artifactsDir, `distill-report-${new Date().toISOString().slice(0, 10)}.md`)
        await writeFile(reportPath, report, 'utf8')
        console.log(`[distill-wisdom] 报告已写入: ${reportPath}`)
    } else {
        console.log(report)
    }
}

main().catch((err) => {
    console.error('[distill-wisdom] 错误:', err)
    process.exit(1)
})
