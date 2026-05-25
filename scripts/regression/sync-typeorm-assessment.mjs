import { readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { isDirectExecution, parseCliOptions } from '../shared/cli.mjs'
import {
    resolveRegressionWindowPath,
    toPosixRelativePath,
    upsertRegressionWindowEntry,
} from '../shared/regression-window.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..', '..')

function extractHeadingSection(markdown, heading) {
    const lines = markdown.split('\n')
    const startIndex = lines.findIndex((line) => line.trim() === heading)

    if (startIndex === -1) {
        throw new Error(`[typeorm-assessment-sync] Missing heading: ${heading}`)
    }

    const headingLevel = lines[startIndex].match(/^#+/u)?.[0].length ?? 1
    let endIndex = lines.length

    for (let index = startIndex + 1; index < lines.length; index++) {
        const match = lines[index].match(/^(#+)\s/u)

        if (match && match[1].length <= headingLevel) {
            endIndex = index
            break
        }
    }

    return lines.slice(startIndex + 1, endIndex).join('\n').trim()
}

function findHeadingByPrefix(markdown, headingPrefix) {
    const heading = markdown
        .split('\n')
        .map((line) => line.trim())
        .find((line) => line.startsWith(headingPrefix))

    if (!heading) {
        throw new Error(`[typeorm-assessment-sync] Missing heading prefix: ${headingPrefix}`)
    }

    return heading
}

function summarizeGoNoGo(sectionBody) {
    const sectionLines = sectionBody
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.startsWith('- '))
        .map((line) => line.slice(2).trim())

    return [
        sectionLines.find((line) => line.includes('NO-GO')),
        sectionLines.find((line) => line.includes('GO（评估任务上收）')),
        sectionLines.find((line) => line.includes('下一触发点')),
    ].filter(Boolean).join('；')
}

function countProbeItems(sectionBody) {
    return sectionBody
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => /^\d+\. /u.test(line)).length
}

export function buildTypeormAssessmentWindowEntry({
    assessmentPath,
    dateStr,
    goNoGoSummary,
    phase,
    probeItemCount,
    projectRoot = repoRoot,
}) {
    const regressionWindowPath = resolveRegressionWindowPath(projectRoot)
    const assessmentRelative = toPosixRelativePath(regressionWindowPath, assessmentPath)

    return {
        body: [
            '- 执行入口: `pnpm regression:typeorm-assessment`',
            `- 事实源: [docs/design/governance/typeorm-v1-upgrade-assessment.md](${assessmentRelative})`,
            `- 结果摘要: ${goNoGoSummary}`,
            `- 已执行验证: 已同步设计文档中的 ${probeItemCount} 条首轮 probe 记录。`,
            '- Review Gate: `Pass` / `warning`；主要问题=直接升级仍为 `NO-GO`，需先完成 `FindOptionsSelect` / `FindOptionsRelations` 旧语法迁移并隔离 `packages/**` typecheck 噪音。',
            '- 未覆盖边界: 本回填仅同步评估结论与 probe 摘要；更细的 failure buckets、回滚说明与后续触发条件仍以设计文档为准。',
        ].join('\n'),
        id: `typeorm-assessment:${phase}:${dateStr}`,
        title: `${dateStr} ${phase} TypeORM 1.0.0 升级评估（自动回填）`,
    }
}

export async function syncTypeormAssessmentRecord(options = {}) {
    const projectRoot = options.projectRoot ?? repoRoot
    const assessmentPath = options.assessmentPath ?? path.join(projectRoot, 'docs', 'design', 'governance', 'typeorm-v1-upgrade-assessment.md')
    const dateStr = options.date ?? new Date().toISOString().slice(0, 10)
    const phase = options.phase ?? '第四十阶段'
    const assessmentContent = await readFile(assessmentPath, 'utf8')
    const goNoGoSection = extractHeadingSection(assessmentContent, '## 8. 最终 go/no-go 建议')
    const probeSection = extractHeadingSection(assessmentContent, findHeadingByPrefix(assessmentContent, '### 6.1 '))

    await upsertRegressionWindowEntry(buildTypeormAssessmentWindowEntry({
        assessmentPath,
        dateStr,
        goNoGoSummary: summarizeGoNoGo(goNoGoSection),
        phase,
        probeItemCount: countProbeItems(probeSection),
        projectRoot,
    }), {
        projectRoot,
    })

    return {
        assessmentPath,
        phase,
    }
}

async function main(argv = process.argv) {
    const options = parseCliOptions(argv, {
        defaults: {
            assessmentPath: null,
            date: null,
            phase: '第四十阶段',
        },
        values: {
            '--assessment': { key: 'assessmentPath' },
            '--date': { key: 'date' },
            '--phase': { key: 'phase' },
        },
    })

    await syncTypeormAssessmentRecord(options)
}

if (isDirectExecution(import.meta.url)) {
    try {
        await main()
    } catch (error) {
        console.error(error instanceof Error ? error.message : String(error))
        process.exit(1)
    }
}
