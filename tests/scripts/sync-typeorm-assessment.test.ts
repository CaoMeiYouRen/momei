import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { syncTypeormAssessmentRecord } from '@/scripts/regression/sync-typeorm-assessment.mjs'

async function writeProjectFile(baseDir: string, relativePath: string, content: string) {
    const absolutePath = resolve(baseDir, relativePath)

    await mkdir(dirname(absolutePath), { recursive: true })
    await writeFile(absolutePath, content, 'utf8')
}

function countOccurrences(content: string, needle: string) {
    return content.split(needle).length - 1
}

describe('sync-typeorm-assessment', () => {
    it('syncs a compact go/no-go record into the regression window and updates in place', async () => {
        const directory = await mkdtemp(join(tmpdir(), 'typeorm-assessment-'))

        await writeProjectFile(directory, 'docs/reports/regression/current.md', [
            '# 当前回归窗口',
            '',
            '## 说明',
            '',
            '- 测试窗口。',
        ].join('\n'))

        await writeProjectFile(directory, 'docs/design/governance/typeorm-v1-upgrade-assessment.md', [
            '# TypeORM 1.0.0 升级专项评估',
            '',
            '### 6.1 2026-05-25 首轮探针实测',
            '',
            '1. `pnpm up typeorm@1.0.0`',
            '   - 结果：完成隔离 probe。',
            '2. `pnpm run typecheck`',
            '   - 结果：失败。',
            '',
            '## 8. 最终 go/no-go 建议',
            '',
            '- 当前建议：`NO-GO（直接升级）`。',
            '- 当前建议：`GO（评估任务上收）`。',
            '- 下一触发点：先补齐旧语法迁移，再重跑最小验证矩阵。',
        ].join('\n'))

        await syncTypeormAssessmentRecord({
            date: '2026-05-25',
            phase: '第四十阶段',
            projectRoot: directory,
        })

        let regressionWindow = await readFile(resolve(directory, 'docs/reports/regression/current.md'), 'utf8')
        expect(regressionWindow).toContain('TypeORM 1.0.0 升级评估（自动回填）')
        expect(regressionWindow).toContain('NO-GO（直接升级）')
        expect(regressionWindow).toContain('已同步设计文档中的 2 条首轮 probe 记录')

        await writeProjectFile(directory, 'docs/design/governance/typeorm-v1-upgrade-assessment.md', [
            '# TypeORM 1.0.0 升级专项评估',
            '',
            '### 6.1 2026-05-25 首轮探针实测',
            '',
            '1. `pnpm up typeorm@1.0.0`',
            '   - 结果：完成隔离 probe。',
            '2. `pnpm run typecheck`',
            '   - 结果：失败。',
            '',
            '## 8. 最终 go/no-go 建议',
            '',
            '- 当前建议：`NO-GO（直接升级）`。',
            '- 当前建议：`GO（评估任务上收）`。',
            '- 下一触发点：先隔离 `packages/**` 噪音，再重跑最小验证矩阵。',
        ].join('\n'))

        await syncTypeormAssessmentRecord({
            date: '2026-05-25',
            phase: '第四十阶段',
            projectRoot: directory,
        })

        regressionWindow = await readFile(resolve(directory, 'docs/reports/regression/current.md'), 'utf8')
        expect(regressionWindow).toContain('先隔离 `packages/**` 噪音，再重跑最小验证矩阵。')
        expect(countOccurrences(regressionWindow, 'TypeORM 1.0.0 升级评估（自动回填）')).toBe(1)

        await rm(directory, { force: true, recursive: true })
    })
})
